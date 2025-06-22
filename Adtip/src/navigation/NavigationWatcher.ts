import { navigationRef } from './NavigationService';
import { AppState, AppStateStatus } from 'react-native';

class NavigationWatcher {
  private static instance: NavigationWatcher;
  private isWatching: boolean = false;
  private navigationHistory: string[] = [];
  private maxHistorySize: number = 50;
  private appStateSubscription: any = null;

  private constructor() {}

  public static getInstance(): NavigationWatcher {
    if (!NavigationWatcher.instance) {
      NavigationWatcher.instance = new NavigationWatcher();
    }
    return NavigationWatcher.instance;
  }

  /**
   * Start watching navigation events for debugging
   */
  public startWatching(): void {
    if (this.isWatching) return;

    this.isWatching = true;
    console.log('[NavigationWatcher] Started watching navigation events');

    // Watch for navigation state changes
    navigationRef.addListener('state', (state) => {
      const currentRoute = navigationRef.getCurrentRoute();
      if (currentRoute) {
        this.addToHistory(`Navigated to: ${currentRoute.name}`);
        console.log('[NavigationWatcher] Current route:', currentRoute.name, currentRoute.params);
      }
    });

    // Watch for navigation ready
    navigationRef.addListener('ready', () => {
      this.addToHistory('Navigation ready');
      console.log('[NavigationWatcher] Navigation is ready');
    });

    // Watch for app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  /**
   * Stop watching navigation events
   */
  public stopWatching(): void {
    if (!this.isWatching) return;

    this.isWatching = false;
    console.log('[NavigationWatcher] Stopped watching navigation events');
    
    // Remove app state listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    this.addToHistory(`App state changed to: ${nextAppState}`);
    console.log('[NavigationWatcher] App state changed to:', nextAppState);
    
    if (nextAppState === 'active') {
      // Log current navigation state when app becomes active
      const currentRoute = navigationRef.getCurrentRoute();
      if (currentRoute) {
        console.log('[NavigationWatcher] App active - current route:', currentRoute.name);
      }
    }
  };

  /**
   * Add event to navigation history
   */
  private addToHistory(event: string): void {
    const timestamp = new Date().toISOString();
    this.navigationHistory.push(`${timestamp}: ${event}`);
    
    // Keep history size manageable
    if (this.navigationHistory.length > this.maxHistorySize) {
      this.navigationHistory = this.navigationHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get navigation history for debugging
   */
  public getNavigationHistory(): string[] {
    return [...this.navigationHistory];
  }

  /**
   * Log navigation history to console
   */
  public logNavigationHistory(): void {
    console.log('[NavigationWatcher] Navigation History:');
    this.navigationHistory.forEach((event, index) => {
      console.log(`${index + 1}. ${event}`);
    });
  }

  /**
   * Check current navigation state
   */
  public checkNavigationState(): void {
    const isReady = navigationRef.isReady();
    const currentRoute = navigationRef.getCurrentRoute();
    
    console.log('[NavigationWatcher] Current state:', {
      isReady,
      currentRoute: currentRoute?.name,
      params: currentRoute?.params,
      canGoBack: navigationRef.canGoBack()
    });
  }

  /**
   * Get current navigation metrics
   */
  public getNavigationMetrics(): {
    isReady: boolean;
    currentRoute: string | undefined;
    canGoBack: boolean;
    historyLength: number;
    isWatching: boolean;
  } {
    const currentRoute = navigationRef.getCurrentRoute();
    
    return {
      isReady: navigationRef.isReady(),
      currentRoute: currentRoute?.name,
      canGoBack: navigationRef.canGoBack(),
      historyLength: this.navigationHistory.length,
      isWatching: this.isWatching
    };
  }

  /**
   * Clear navigation history
   */
  public clearHistory(): void {
    this.navigationHistory = [];
    console.log('[NavigationWatcher] Navigation history cleared');
  }
}

export default NavigationWatcher;
