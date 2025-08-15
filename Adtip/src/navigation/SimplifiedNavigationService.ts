// src/navigation/SimplifiedNavigationService.ts
import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Logger } from '../utils/ProductionLogger';

// ✅ TYPED NAVIGATION REF
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// ✅ NAVIGATION STATE
interface NavigationState {
  isReady: boolean;
  currentRoute: string | null;
  navigationHistory: string[];
  isNavigating: boolean;
}

class NavigationManager {
  private state: NavigationState = {
    isReady: false,
    currentRoute: null,
    navigationHistory: [],
    isNavigating: false,
  };

  private retryQueue: Array<() => void> = [];
  private maxRetries = 3;
  private retryDelay = 200;

  // ✅ INITIALIZATION
  initialize() {
    this.state.isReady = navigationRef.isReady();
    
    // Listen for navigation state changes
    if (this.state.isReady) {
      this.updateCurrentRoute();
    }
  }

  // ✅ CORE NAVIGATION METHODS
  navigate<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName],
    options?: { replace?: boolean; reset?: boolean }
  ): boolean {
    if (!this.isReady()) {
      this.queueNavigation(() => this.navigate(name, params, options));
      return false;
    }

    try {
      this.state.isNavigating = true;
      
      if (options?.reset) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: name as any, params: params as any }],
        });
      } else if (options?.replace) {
        (navigationRef as any).replace(name, params);
      } else {
        navigationRef.navigate(name as any, params as any);
      }

      this.addToHistory(name as string);
      this.updateCurrentRoute();
      
      Logger.debug('NavigationService', `Navigated to ${name as string}`, params);
      return true;
    } catch (error) {
      Logger.error('NavigationService', `Navigation failed to ${name as string}`, error);
      return false;
    } finally {
      this.state.isNavigating = false;
    }
  }

  goBack(): boolean {
    if (!this.isReady()) {
      this.queueNavigation(() => this.goBack());
      return false;
    }

    if (!navigationRef.canGoBack()) {
      Logger.warn('NavigationService', 'Cannot go back - no previous screen');
      return false;
    }

    try {
      navigationRef.goBack();
      this.updateCurrentRoute();
      Logger.debug('NavigationService', 'Navigated back');
      return true;
    } catch (error) {
      Logger.error('NavigationService', 'Go back failed', error);
      return false;
    }
  }

  reset<RouteName extends keyof RootStackParamList>(
    routeName: RouteName,
    params?: RootStackParamList[RouteName]
  ): boolean {
    return this.navigate(routeName, params, { reset: true });
  }

  replace<RouteName extends keyof RootStackParamList>(
    routeName: RouteName,
    params?: RootStackParamList[RouteName]
  ): boolean {
    return this.navigate(routeName, params, { replace: true });
  }

  // ✅ SPECIALIZED NAVIGATION METHODS
  navigateToMeeting(params: {
    meetingId: string;
    token: string;
    displayName: string;
    callType: 'voice' | 'video';
    isInitiator?: boolean;
    recipientName?: string;
    callData?: any;
    localParticipantId?: string;
  }): boolean {
    // Validate required parameters
    if (!params.meetingId || !params.token || !params.displayName) {
      Logger.error('NavigationService', 'Invalid meeting parameters', params);
      return false;
    }

    try {
      // Direct navigation to Meeting screen (it's at root level)
      Logger.info('NavigationService', 'Navigating to Meeting screen', {
        meetingId: params.meetingId,
        callType: params.callType,
        displayName: params.displayName
      });

      if (!this.isReady()) {
        Logger.warn('NavigationService', 'Navigation not ready, queueing meeting navigation');
        this.queueNavigation(() => this.navigateToMeeting(params));
        return false;
      }

      // Meeting screen is at root level, not nested in Main
      navigationRef.navigate('Meeting' as any, params);
      this.updateCurrentRoute();
      Logger.info('NavigationService', 'Successfully navigated to Meeting screen');
      return true;

    } catch (error) {
      Logger.error('NavigationService', 'Failed to navigate to Meeting screen', error);
      return false;
    }
  }

  navigateToAuth(screen?: 'Onboarding' | 'Login' | 'OTP' | 'UserDetails'): boolean {
    if (screen) {
      return this.navigate('Auth', { screen } as any);
    }
    return this.navigate('Auth');
  }

  navigateToMain(screen?: string): boolean {
    if (screen) {
      return this.navigate('Main', { screen } as any);
    }
    return this.navigate('Main');
  }

  // ✅ STATE MANAGEMENT
  isReady(): boolean {
    const ready = navigationRef.isReady();
    this.state.isReady = ready;
    return ready;
  }

  getCurrentRoute(): string | null {
    if (!this.isReady()) return null;
    
    try {
      const route = navigationRef.getCurrentRoute();
      this.state.currentRoute = route?.name || null;
      return this.state.currentRoute;
    } catch (error) {
      Logger.error('NavigationService', 'Failed to get current route', error);
      return null;
    }
  }

  getNavigationState() {
    return { ...this.state };
  }

  // ✅ RETRY MECHANISM
  private queueNavigation(navigationFn: () => void) {
    if (this.retryQueue.length >= 10) {
      Logger.warn('NavigationService', 'Navigation queue full, dropping oldest request');
      this.retryQueue.shift();
    }

    this.retryQueue.push(navigationFn);
    this.processRetryQueue();
  }

  private async processRetryQueue() {
    let retries = 0;

    while (this.retryQueue.length > 0 && retries < this.maxRetries) {
      if (this.isReady()) {
        const navigationFn = this.retryQueue.shift();
        if (navigationFn) {
          try {
            navigationFn();
            Logger.debug('NavigationService', 'Successfully processed queued navigation');
          } catch (error) {
            Logger.error('NavigationService', 'Error executing queued navigation', error);
          }
        }
      } else {
        retries++;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }

    if (this.retryQueue.length > 0) {
      Logger.error('NavigationService', `Failed to process ${this.retryQueue.length} queued navigations`, {
        queueLength: this.retryQueue.length,
        maxRetries: this.maxRetries,
        isReady: this.isReady()
      });
      this.retryQueue = []; // Clear failed queue
    }
  }

  // ✅ UTILITY METHODS
  private updateCurrentRoute() {
    this.getCurrentRoute();
  }

  private addToHistory(routeName: string) {
    this.state.navigationHistory.push(routeName);
    
    // Keep only last 10 routes
    if (this.state.navigationHistory.length > 10) {
      this.state.navigationHistory = this.state.navigationHistory.slice(-10);
    }
  }

  // ✅ DEBUGGING METHODS
  getNavigationHistory(): string[] {
    return [...this.state.navigationHistory];
  }

  clearHistory() {
    this.state.navigationHistory = [];
  }

  // ✅ CLEANUP
  cleanup() {
    this.retryQueue = [];
    this.state.navigationHistory = [];
  }
}

// ✅ SINGLETON INSTANCE
const navigationManager = new NavigationManager();

// ✅ EXPORTED FUNCTIONS (Backward compatibility)
export const navigate = navigationManager.navigate.bind(navigationManager);
export const goBack = navigationManager.goBack.bind(navigationManager);
export const resetTo = navigationManager.reset.bind(navigationManager);
export const isNavigationReady = navigationManager.isReady.bind(navigationManager);
export const getCurrentRoute = navigationManager.getCurrentRoute.bind(navigationManager);

// ✅ SPECIALIZED EXPORTS
export const navigateToMeeting = navigationManager.navigateToMeeting.bind(navigationManager);
export const navigateToAuth = navigationManager.navigateToAuth.bind(navigationManager);
export const navigateToMain = navigationManager.navigateToMain.bind(navigationManager);

// ✅ UTILITY EXPORTS
export const getNavigationState = navigationManager.getNavigationState.bind(navigationManager);
export const getNavigationHistory = navigationManager.getNavigationHistory.bind(navigationManager);

// ✅ INITIALIZATION
export const initializeNavigation = () => {
  navigationManager.initialize();
};

// ✅ CLEANUP
export const cleanupNavigation = () => {
  navigationManager.cleanup();
};

// ✅ NAVIGATION MANAGER EXPORT
export { navigationManager };

// ✅ LEGACY SUPPORT (Deprecated - use navigationManager methods instead)
export const navigateWithRetry = navigate;
export const resetMeetingNavigationState = () => {
  Logger.debug('NavigationService', 'Legacy resetMeetingNavigationState called');
};

export default navigationManager;
