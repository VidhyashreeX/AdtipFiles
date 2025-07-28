// src/services/AuthFlowService.ts
import { navigationRef } from '../navigation/NavigationService';
import { Logger } from '../utils/ProductionLogger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavigationAnalyticsService from './NavigationAnalyticsService';

export interface AuthState {
  isAuthenticated: boolean;
  isGuest: boolean;
  user: any;
  hasCompletedOnboarding: boolean;
}

export interface AuthFlowDecision {
  navigator: 'Auth' | 'Main' | 'Guest';
  screen?: string;
  shouldReset: boolean;
  reason: string;
}

class AuthFlowService {
  private static instance: AuthFlowService;
  private currentAuthState: AuthState | null = null;
  private isProcessingTransition = false;

  private constructor() {}

  static getInstance(): AuthFlowService {
    if (!AuthFlowService.instance) {
      AuthFlowService.instance = new AuthFlowService();
    }
    return AuthFlowService.instance;
  }

  /**
   * Determine the correct navigation destination based on auth state
   */
  determineNavigationFlow(authState: AuthState): AuthFlowDecision {
    Logger.debug('AuthFlowService', 'Determining navigation flow:', authState);

    // Guest mode
    if (authState.isGuest) {
      return {
        navigator: 'Guest',
        shouldReset: true,
        reason: 'User is in guest mode',
      };
    }

    // Not authenticated - go to auth flow
    if (!authState.isAuthenticated) {
      const screen = authState.hasCompletedOnboarding ? 'Login' : 'Onboarding';
      return {
        navigator: 'Auth',
        screen,
        shouldReset: true,
        reason: 'User not authenticated',
      };
    }

    // Authenticated but incomplete profile
    if (authState.isAuthenticated && (!authState.user?.name || authState.user?.isSaveUserDetails !== 1)) {
      return {
        navigator: 'Auth',
        screen: 'UserDetails',
        shouldReset: true,
        reason: 'User profile incomplete',
      };
    }

    // Fully authenticated with complete profile
    if (authState.isAuthenticated && authState.user?.name && authState.user?.isSaveUserDetails === 1) {
      return {
        navigator: 'Main',
        shouldReset: true,
        reason: 'User fully authenticated',
      };
    }

    // Fallback to auth
    return {
      navigator: 'Auth',
      screen: 'Onboarding',
      shouldReset: true,
      reason: 'Fallback to auth flow',
    };
  }

  /**
   * Handle auth state change and navigate accordingly
   */
  async handleAuthStateChange(newAuthState: AuthState): Promise<void> {
    // Prevent concurrent transitions
    if (this.isProcessingTransition) {
      Logger.debug('AuthFlowService', 'Transition already in progress, skipping');
      return;
    }

    // Check if state actually changed
    if (this.hasAuthStateChanged(newAuthState)) {
      this.isProcessingTransition = true;
      
      try {
        const decision = this.determineNavigationFlow(newAuthState);
        await this.executeNavigation(decision);
        this.currentAuthState = { ...newAuthState };
        
        // Track auth flow analytics
        NavigationAnalyticsService.getInstance().trackAuthFlow(
          'state_change',
          decision.navigator,
          {
            screen: decision.screen,
            reason: decision.reason,
            authState: newAuthState,
          }
        );

        Logger.info('AuthFlowService', 'Auth state transition completed:', {
          navigator: decision.navigator,
          screen: decision.screen,
          reason: decision.reason,
        });
      } catch (error) {
        Logger.error('AuthFlowService', 'Failed to handle auth state change:', error);
      } finally {
        this.isProcessingTransition = false;
      }
    }
  }

  /**
   * Check if auth state has meaningfully changed
   */
  private hasAuthStateChanged(newState: AuthState): boolean {
    if (!this.currentAuthState) return true;

    const current = this.currentAuthState;
    
    return (
      current.isAuthenticated !== newState.isAuthenticated ||
      current.isGuest !== newState.isGuest ||
      current.user?.name !== newState.user?.name ||
      current.user?.isSaveUserDetails !== newState.user?.isSaveUserDetails ||
      current.hasCompletedOnboarding !== newState.hasCompletedOnboarding
    );
  }

  /**
   * Execute the navigation decision
   */
  private async executeNavigation(decision: AuthFlowDecision): Promise<void> {
    if (!navigationRef.isReady()) {
      Logger.warn('AuthFlowService', 'Navigation not ready, deferring transition');
      // Retry after a short delay
      setTimeout(() => this.executeNavigation(decision), 100);
      return;
    }

    try {
      if (decision.shouldReset) {
        const routes: any[] = [];

        if (decision.navigator === 'Auth') {
          routes.push({
            name: 'Auth',
            params: decision.screen ? { screen: decision.screen } : undefined,
          });
        } else {
          routes.push({ name: decision.navigator });
        }

        navigationRef.reset({
          index: 0,
          routes,
        });

        Logger.debug('AuthFlowService', 'Navigation reset completed:', {
          navigator: decision.navigator,
          screen: decision.screen,
        });
      } else {
        // Simple navigation without reset
        if (decision.screen) {
          navigationRef.navigate(decision.navigator as any, { screen: decision.screen });
        } else {
          navigationRef.navigate(decision.navigator as any);
        }
      }
    } catch (error) {
      Logger.error('AuthFlowService', 'Navigation execution failed:', error);
      throw error;
    }
  }

  /**
   * Handle logout - clear state and navigate to auth
   */
  async handleLogout(): Promise<void> {
    Logger.info('AuthFlowService', 'Handling logout');
    
    try {
      // Clear stored onboarding state
      await AsyncStorage.removeItem('@onboarding_completed');
      
      // Reset auth state
      this.currentAuthState = null;
      this.isProcessingTransition = false;
      
      // Navigate to onboarding
      const decision: AuthFlowDecision = {
        navigator: 'Auth',
        screen: 'Onboarding',
        shouldReset: true,
        reason: 'User logged out',
      };
      
      await this.executeNavigation(decision);
      
      Logger.info('AuthFlowService', 'Logout navigation completed');
    } catch (error) {
      Logger.error('AuthFlowService', 'Logout navigation failed:', error);
    }
  }

  /**
   * Handle guest mode entry
   */
  async enterGuestMode(): Promise<void> {
    Logger.info('AuthFlowService', 'Entering guest mode');
    
    const guestState: AuthState = {
      isAuthenticated: false,
      isGuest: true,
      user: null,
      hasCompletedOnboarding: true, // Guests skip onboarding
    };
    
    await this.handleAuthStateChange(guestState);
  }

  /**
   * Handle guest mode exit
   */
  async exitGuestMode(): Promise<void> {
    Logger.info('AuthFlowService', 'Exiting guest mode');
    
    const authState: AuthState = {
      isAuthenticated: false,
      isGuest: false,
      user: null,
      hasCompletedOnboarding: await this.getOnboardingStatus(),
    };
    
    await this.handleAuthStateChange(authState);
  }

  /**
   * Get onboarding completion status
   */
  private async getOnboardingStatus(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem('@onboarding_completed');
      return completed === 'true';
    } catch (error) {
      Logger.error('AuthFlowService', 'Failed to get onboarding status:', error);
      return false;
    }
  }

  /**
   * Mark onboarding as completed
   */
  async markOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      Logger.debug('AuthFlowService', 'Onboarding marked as completed');
    } catch (error) {
      Logger.error('AuthFlowService', 'Failed to mark onboarding completed:', error);
    }
  }

  /**
   * Get current auth state
   */
  getCurrentAuthState(): AuthState | null {
    return this.currentAuthState;
  }

  /**
   * Reset service state
   */
  reset(): void {
    this.currentAuthState = null;
    this.isProcessingTransition = false;
    Logger.debug('AuthFlowService', 'Service state reset');
  }
}

export default AuthFlowService;
