// src/services/NavigationPersistenceService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationState, PartialState } from '@react-navigation/native';
import { Logger } from '../utils/ProductionLogger';

const NAVIGATION_STATE_KEY = '@navigation_state';
const NAVIGATION_TIMESTAMP_KEY = '@navigation_timestamp';
const STATE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

export interface PersistedNavigationState {
  state: NavigationState | PartialState<NavigationState>;
  timestamp: number;
  version: string;
}

class NavigationPersistenceService {
  private readonly version = '1.0.0';
  private isRestoring = false;

  /**
   * Save navigation state to AsyncStorage
   */
  async saveNavigationState(state: NavigationState): Promise<void> {
    try {
      // Don't save state during restoration to avoid conflicts
      if (this.isRestoring) {
        return;
      }

      // Filter out sensitive or temporary screens that shouldn't be restored
      const filteredState = this.filterSensitiveScreens(state);
      
      const persistedState: PersistedNavigationState = {
        state: filteredState,
        timestamp: Date.now(),
        version: this.version,
      };

      await AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(persistedState));
      Logger.debug('NavigationPersistence', 'Navigation state saved successfully');
    } catch (error) {
      Logger.error('NavigationPersistence', 'Failed to save navigation state:', error);
    }
  }

  /**
   * Restore navigation state from AsyncStorage
   */
  async restoreNavigationState(): Promise<NavigationState | undefined> {
    try {
      this.isRestoring = true;
      
      const savedStateString = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
      
      if (!savedStateString) {
        Logger.debug('NavigationPersistence', 'No saved navigation state found');
        return undefined;
      }

      const persistedState: PersistedNavigationState = JSON.parse(savedStateString);
      
      // Check if state is expired
      if (this.isStateExpired(persistedState.timestamp)) {
        Logger.debug('NavigationPersistence', 'Saved navigation state is expired, clearing');
        await this.clearNavigationState();
        return undefined;
      }

      // Check version compatibility
      if (persistedState.version !== this.version) {
        Logger.debug('NavigationPersistence', 'Navigation state version mismatch, clearing');
        await this.clearNavigationState();
        return undefined;
      }

      // Validate state structure
      if (!this.isValidNavigationState(persistedState.state)) {
        Logger.warn('NavigationPersistence', 'Invalid navigation state structure, clearing');
        await this.clearNavigationState();
        return undefined;
      }

      Logger.debug('NavigationPersistence', 'Navigation state restored successfully');
      return persistedState.state as NavigationState;
    } catch (error) {
      Logger.error('NavigationPersistence', 'Failed to restore navigation state:', error);
      await this.clearNavigationState();
      return undefined;
    } finally {
      this.isRestoring = false;
    }
  }

  /**
   * Clear saved navigation state
   */
  async clearNavigationState(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([NAVIGATION_STATE_KEY, NAVIGATION_TIMESTAMP_KEY]);
      Logger.debug('NavigationPersistence', 'Navigation state cleared');
    } catch (error) {
      Logger.error('NavigationPersistence', 'Failed to clear navigation state:', error);
    }
  }

  /**
   * Filter out screens that shouldn't be persisted
   */
  private filterSensitiveScreens(state: NavigationState): NavigationState {
    const sensitiveScreens = [
      'Meeting',
      'MeetingSimple', 
      'VideoPlayerModal',
      'InitialLoading',
    ];

    const filterRoutes = (routes: any[]): any[] => {
      return routes
        .filter(route => !sensitiveScreens.includes(route.name))
        .map(route => {
          if (route.state?.routes) {
            return {
              ...route,
              state: {
                ...route.state,
                routes: filterRoutes(route.state.routes),
              },
            };
          }
          return route;
        });
    };

    const filteredRoutes = filterRoutes(state.routes);
    
    // If all routes were filtered out, return a safe default state
    if (filteredRoutes.length === 0) {
      return {
        ...state,
        index: 0,
        routes: [{ name: 'Main', params: { screen: 'Home' } }],
      };
    }

    return {
      ...state,
      routes: filteredRoutes,
      index: Math.min(state.index, filteredRoutes.length - 1),
    };
  }

  /**
   * Check if saved state is expired
   */
  private isStateExpired(timestamp: number): boolean {
    return Date.now() - timestamp > STATE_EXPIRY_TIME;
  }

  /**
   * Validate navigation state structure
   */
  private isValidNavigationState(state: any): boolean {
    if (!state || typeof state !== 'object') {
      return false;
    }

    if (!Array.isArray(state.routes) || state.routes.length === 0) {
      return false;
    }

    if (typeof state.index !== 'number' || state.index < 0 || state.index >= state.routes.length) {
      return false;
    }

    // Validate each route has a name
    return state.routes.every((route: any) => 
      route && typeof route === 'object' && typeof route.name === 'string'
    );
  }

  /**
   * Get safe initial state for navigation
   */
  getSafeInitialState(): NavigationState {
    return {
      index: 0,
      routes: [{ name: 'Auth' }],
      key: 'root',
      routeNames: ['Auth', 'Main', 'Guest'],
      history: [],
      type: 'stack',
      stale: false,
    };
  }

  /**
   * Check if we should restore state based on app launch context
   */
  shouldRestoreState(): boolean {
    // Don't restore state if app was launched from a notification or deep link
    // This will be enhanced with proper deep link detection
    return true;
  }
}

export default new NavigationPersistenceService();
