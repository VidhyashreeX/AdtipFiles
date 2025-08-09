import React, {createContext, useState, useContext, useEffect, useMemo, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL, ENDPOINTS} from '../constants/api';
import ApiService from '../services/ApiService';
import {navigationRef} from '../navigation/NavigationService';
import LastSeenService from '../services/LastSeenService'; // Ensure this import is present
// UnifiedCallService removed - using simplified calling flow
import FirebaseService from '../services/FirebaseService';
import UserDataStorageService from '../services/UserDataStorageService';
import { userDataManager, UserSessionData } from '../services/UserDataManager';
import { Logger } from '../utils/ProductionLogger';
import { ApiResponse, OtpLoginResponse as ApiOtpResponse, OtpVerifyResponse as ApiUserType, OtpVerifyApiResponse } from '../types/api';

// Define user type (using the one from api.ts for consistency)
interface ExtendedUser extends ApiUserType {
  banner_image?: string | null;
}

// Update the User type export to use the extended interface
export type User = ExtendedUser;

type OtpResponse = ApiOtpResponse;

// Add premium/content premium/wallet state to context
interface PremiumState {
  isPremium: boolean;
  premiumPlanId: number;
  contentCreatorPlanId: number;
  walletBalance: string;
}

// Define context type
type AuthContextType = {
  isAuthenticated: boolean;
  isGuest: boolean; // Add guest mode flag
  user: User | null;
  loading: boolean; // For individual operations like login, verifyOtp
  error: string | null;
  isInitialized: boolean; // <-- Add this
  login: (mobileNumber: string) => Promise<ApiResponse<OtpResponse[]>>;  // Updated return type
  verifyOtp: (mobileNumber: string, otp: string, id: string) => Promise<OtpVerifyApiResponse>;
  logout: () => Promise<void>;
  enterGuestMode: () => Promise<void>; // Add guest mode entry
  exitGuestMode: () => Promise<void>; // Add guest mode exit
  updateUserDetails: (userData: Partial<User> & {
    languages?: number;
    interests?: number;
  }) => Promise<void>;
  refreshUserData: () => Promise<void>;
  hasChannel: boolean;
  createChannel: (name: string, description: string) => Promise<void>;
  completeOnboarding: () => void;
  premiumState: PremiumState;
  setPremiumState: React.Dispatch<React.SetStateAction<PremiumState>>;
};

// Create context
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isGuest: false, // Default guest mode to false
  user: null,
  loading: false, // Default operation loading to false
  error: null,
  isInitialized: false, // <-- Default to false
  login: async () => ({
    status: false,
    message: 'Default login implementation',
  }) as ApiResponse<OtpResponse[]>,
  verifyOtp: async () => ({}) as OtpVerifyApiResponse,
  logout: async () => {},
  enterGuestMode: async () => {}, // Default guest mode entry
  exitGuestMode: async () => {}, // Default guest mode exit
  updateUserDetails: async () => {},
  refreshUserData: async () => {},
  hasChannel: false,
  createChannel: async () => {},
  completeOnboarding: () => {},
  premiumState: {
    isPremium: false,
    premiumPlanId: 0,
    contentCreatorPlanId: 0,
    walletBalance: '0.00',
  },
  setPremiumState: () => {},
});

// Auth provider component
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false); // Add guest state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // For individual operations
  const [error, setError] = useState<string | null>(null);
  const [hasChannel, setHasChannel] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // <-- Add state
  const [premiumState, setPremiumState] = useState<PremiumState>({
    isPremium: false,
    premiumPlanId: 0,
    contentCreatorPlanId: 0,
    walletBalance: '0.00',
  });

  const completeOnboarding = () => {
    // ✅ FIX: Do NOT set isAuthenticated here - this is only for onboarding completion
    // Authentication should only be set after successful login/OTP verification
    if (user && user.is_first_time === 1 && user.isSaveUserDetails === 1) {
         LastSeenService.startTracking();
    }
    // Mark onboarding as completed in storage for future reference
    AsyncStorage.setItem('@onboarding_completed', 'true').catch(error => {
      Logger.error('AuthContext', 'Failed to mark onboarding completed:', error);
    });
  };

  // Load user from storage on mount with timeout protection
  useEffect(() => {
    const loadUser = async () => {
      try {
        Logger.info('AuthContext', '🔄 Starting user initialization...');

        // Initialize UserDataManager first
        await userDataManager.initialize();

        // Clean up any existing guest mode state from previous versions
        await AsyncStorage.removeItem('@guest_mode');

        // Get user data from UserDataManager
        const sessionData = userDataManager.getCurrentUser();

        Logger.info('AuthContext', '📱 Loading user state:', {
          hasSessionData: !!sessionData,
          hasToken: !!sessionData?.accessToken,
          hasChannelData: userDataManager.hasChannelData(),
        });

        // Check if user is authenticated first
        if (sessionData && sessionData.accessToken) {
          // Convert UserSessionData to User format for compatibility
          const userData: User = {
            id: sessionData.userId,
            name: sessionData.userName,
            is_premium: sessionData.isPremium,
            premium_plan_id: sessionData.premiumPlanId,
            content_creator_plan_id: sessionData.contentCreatorPlanId,
            isSaveUserDetails: 1, // Assume complete if stored in UserDataManager
            is_first_time: 0, // Assume not first time if stored
            // Add other required User fields with defaults
          } as User;

          setUser(userData);
          setIsAuthenticated(true);
          Logger.info('AuthContext', '✅ Authenticated user detected - routing to MainNavigator');

          // Check channel status in background (non-blocking)
          checkChannelStatus(sessionData.userId.toString()).catch(err => {
            Logger.warn('AuthContext', '⚠️ Channel status check failed (non-critical)', err);
          });
        } else {
          Logger.info('AuthContext', '🆕 New user detected - routing to AuthNavigator (OnboardingScreen)');
        }
      } catch (err) {
        Logger.error('AuthContext', '❌ Error loading user data:', err);
        setError('Failed to load user data');
      } finally {
        // setLoading(false); // Not this loading
        Logger.debug('AuthContext', '✅ Marking as initialized');
        setIsInitialized(true); // <-- Mark as initialized
      }
    };

    // Add timeout protection to prevent hanging
    const initWithTimeout = async () => {
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          Logger.warn('AuthContext', '⚠️ Initialization timeout - forcing completion');
          setIsInitialized(true);
          resolve(null);
        }, 10000); // 10 second timeout
      });

      const loadPromise = loadUser();

      // Race between load and timeout
      await Promise.race([loadPromise, timeoutPromise]);
    };

    initWithTimeout();
  }, []);

  // Load premium state from AsyncStorage on mount
  useEffect(() => {
    const loadPremiumState = async () => {
      const isPremium = (await AsyncStorage.getItem('is_premium')) === '1';
      const premiumPlanId = parseInt(await AsyncStorage.getItem('premium_plan_id') || '0', 10);
      const contentCreatorPlanId = parseInt(await AsyncStorage.getItem('content_creator_plan_id') || '0', 10);
      const walletBalance = await AsyncStorage.getItem('wallet_balance') || '0.00';
      setPremiumState({ isPremium, premiumPlanId, contentCreatorPlanId, walletBalance });
    };
    loadPremiumState();
  }, []);

  // Check if user has a channel
  const checkChannelStatus = async (userId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/getchannelbyuserid/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
          },
        },
      );

      const data = await response.json();
      if (data.status && data.data && data.data.length > 0) {
        setHasChannel(true);
      } else {
        setHasChannel(false);
      }
    } catch (err) {
      Logger.error('AuthContext', 'Error checking channel status:', err);
      setHasChannel(false);
    }
  };
  // Login - Send OTP
  const login = useCallback(async (mobileNumber: string): Promise<ApiResponse<OtpResponse[]>> => {
    setLoading(true);
    setError(null);

    try {
      Logger.debug('AuthContext', `Attempting login with number: ${mobileNumber}`);

      const apiResponse = await ApiService.post<ApiResponse<OtpResponse[]>>(ENDPOINTS.OTP_LOGIN, {
        mobileNumber,
        userType: '2',
      });

      Logger.debug('AuthContext', 'Login API response:', JSON.stringify(apiResponse));

      if (apiResponse.status !== 200 || !apiResponse.data || !Array.isArray(apiResponse.data) || apiResponse.data.length === 0) {
        throw new Error(apiResponse.message || 'Failed to send OTP or invalid response structure');
      }

      // Return the response instead of handling navigation
      return apiResponse;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(errorMessage);
      Logger.error('AuthContext', 'Login error details:', {
        message: errorMessage,
        error: err,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed as it only uses props and stable functions
  // Verify OTP
  const verifyOtp = useCallback(async (mobileNumber: string, otp: string, id: string): Promise<OtpVerifyApiResponse> => {
    try {
      setLoading(true);
      
      const response = await ApiService.verifyOtp({
        mobile_number: mobileNumber,
        otp: otp,
        id: id,
      });

      Logger.debug('AuthContext', 'OTP verification response:', response);

      // Handle both response formats
      let userData: User | null = null;
      if ('data' in response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        userData = response.data[0];
      } else if ('id' in response && response.id) {
        userData = response as User;
      }

      if (userData && userData.id) {
        // Store user data using UserDataManager
        setUser(userData);

        // Clear guest mode if user was in guest mode
        if (isGuest) {
          setIsGuest(false);
          Logger.info('AuthContext', 'Cleared guest mode after successful login');
        }

        // Save user session data using UserDataManager (batched operations)
        const sessionData: Partial<UserSessionData> = {
          userId: userData.id,
          userName: userData.name || '',
          isPremium: !!userData.is_premium,
          premiumPlanId: userData.premium_plan_id ?? 0,
          contentCreatorPlanId: userData.content_creator_plan_id ?? 0,
          walletBalance: '0', // Will be updated after wallet API call
          accessToken: response.accessToken,
          isVerified: Boolean(userData.isOtpVerified),
          lastLoginTime: Date.now(),
        };

        await userDataManager.saveUserSession(sessionData);

        // Set authentication state - App.tsx will handle navigation based on isSaveUserDetails
        setIsAuthenticated(true);

        Logger.info('AuthContext', 'User authenticated, isSaveUserDetails:', userData.isSaveUserDetails);

        // Update premium state
        setPremiumState(prev => ({
          ...prev,
          isPremium: !!userData.is_premium,
          premiumPlanId: userData.premium_plan_id ?? 0,
          contentCreatorPlanId: userData.content_creator_plan_id ?? 0,
        }));

        return response;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      Logger.error('AuthContext', 'OTP verification error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isGuest]); // Dependencies: isGuest state
  // Handle authentication errors and token refresh
  /*const handleAuthError = useCallback(async (): Promise<void> => {
    Logger.debug('AuthContext', 'Handling authentication error - clearing auth state');

    try {
      // Clear all authentication data using UserDataManager
      await userDataManager.clearUserData();

      // Reset state
      setUser(null);
      setIsAuthenticated(false);
      setPremiumState({
        isPremium: false,
        premiumPlanId: 0,
        contentCreatorPlanId: 0,
        walletBalance: '0.00',
      });

      Logger.info('AuthContext', '✅ Auth state cleared due to authentication error');
    } catch (error) {
      Logger.error('AuthContext', '❌ Error clearing auth state:', error);
    }
  }, []);*/

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    // setLoading(true); // This is the AuthContext's general 'loading' state,
                      // which is fine if you want a global loading indicator for auth operations.
                      // SettingsScreen uses its own 'authLoading' derived from this.
    setError(null);

    const currentUserId = user?.id; // Get user ID before clearing user state

    try {
      LastSeenService.stopTracking();

      if (currentUserId) { // Check if there was a user to log out
        Logger.debug('AuthContext', `Attempting to call API logout for user ID: ${currentUserId}`);

        // Use the proper ApiService.logout method which handles FCM token cleanup
        await ApiService.logout(String(currentUserId));
        Logger.info('AuthContext', `API logout call successful for user ID: ${currentUserId}`);
      } else {
        Logger.debug('AuthContext', 'No user was signed in, proceeding to clear local data.');
      }
      
      // Clean up all services before clearing storage
      try {
        Logger.debug('AuthContext', 'Resetting FirebaseService...');
        const firebaseService = FirebaseService.getInstance();
        firebaseService.reset();
      } catch (serviceError) {
        Logger.warn('AuthContext', 'Error cleaning up services during logout:', serviceError);
      }

      // Clear user data cache using UserDataManager
      try {
        Logger.info('AuthContext', 'Clearing user data cache...');
        await userDataManager.clearUserData();
        await UserDataStorageService.clearAllUserData();
      } catch (userDataError) {
        Logger.warn('AuthContext', 'Error clearing user data cache during logout', userDataError);
      }

      // Clear remaining AsyncStorage data (keep essential app data)
      const keysToKeep = ['@app_version', '@onboarding_completed', '@language_preference'];
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
      Logger.info('AuthContext', 'User-specific AsyncStorage data cleared.');

      setUser(null);
      setIsAuthenticated(false);
      setIsGuest(false); // Clear guest mode on logout
      setHasChannel(false);
      setPremiumState({
        isPremium: false,
        premiumPlanId: 0,
        contentCreatorPlanId: 0,
        walletBalance: '0.00',
      });
      Logger.debug('AuthContext', 'Local auth state reset.');

      // ✅ SIMPLIFIED: Let navigation state machine handle logout navigation
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{name: 'Auth'}],
        });
        Logger.debug('AuthContext', 'Navigation reset to Auth after logout.');
      }
    } catch (err) {
      Logger.error('AuthContext', 'Error during logout:', err);
      // Even if API logout fails, proceed to clear local data and log out locally
      
      // Still try to clean up services
      try {
        const firebaseService = FirebaseService.getInstance();
        firebaseService.reset();
      } catch (serviceError) {
        Logger.warn('AuthContext', 'Error cleaning up services during logout fallback:', serviceError);
      }
      
      await AsyncStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      setIsGuest(false); // Clear guest mode on logout fallback
      setHasChannel(false);
      setPremiumState({
        isPremium: false,
        premiumPlanId: 0,
        contentCreatorPlanId: 0,
        walletBalance: '0.00',
      });
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{name: 'Onboarding'}],
        });
      }
      // Optionally, rethrow or set an error message that can be displayed to the user
      // setError("Failed to communicate with the server during logout, but you have been logged out locally.");
      throw err; // Re-throw to be caught by SettingsScreen if needed
    } finally {
      // setLoading(false);
    }
  }, [user?.id]); // Dependencies: user.id for logout API call

  // Update user details
  const updateUserDetails = async (userData: Partial<User> & {
    languages?: number;
    interests?: number;
  }): Promise<void> => {
    if (!user) {
      setError('User not authenticated');
      throw new Error('User not authenticated');
    }

    setLoading(true); // Operation loading
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/saveuserdetails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          ...userData,
          id: user.id,
        }),
      });

      const data = await response.json();

      if (data.status !== 200) {
        throw new Error(data.message || 'Failed to update user details');
      }

      const updatedUser = { ...data.data[0], isSaveUserDetails: 1 };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      await AsyncStorage.setItem('is_premium', updatedUser.is_premium ? '1' : '0');
      await AsyncStorage.setItem('premium_plan_id', String(updatedUser.premium_plan_id ?? 0));
      await AsyncStorage.setItem('content_creator_plan_id', String(updatedUser.content_creator_plan_id ?? 0));
      setPremiumState(prev => ({
        ...prev,
        isPremium: updatedUser.is_premium ?? false,
        premiumPlanId: updatedUser.premium_plan_id ?? 0,
        contentCreatorPlanId: updatedUser.content_creator_plan_id ?? 0,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update user details';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false); // Operation loading
    }
  };

  // Refresh user data from API
  const refreshUserData = async (): Promise<void> => {
    setError(null);
    const currentUserId = user?.id;

    if (!currentUserId) {
      Logger.debug('AuthContext', 'No user to refresh.');
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.get<User>(`/api/user/${currentUserId}`); // Assuming an endpoint exists
      
      setUser(response);
      await AsyncStorage.setItem('user', JSON.stringify(response));
      await AsyncStorage.setItem('userName', response.name || '');
      await AsyncStorage.setItem('is_premium', response.is_premium ? '1' : '0');
      await AsyncStorage.setItem('premium_plan_id', String(response.premium_plan_id ?? 0));
      await AsyncStorage.setItem('content_creator_plan_id', String(response.content_creator_plan_id ?? 0));
      setPremiumState(prev => ({
        ...prev,
        isPremium: response.is_premium ?? false,
        premiumPlanId: response.premium_plan_id ?? 0,
        contentCreatorPlanId: response.content_creator_plan_id ?? 0,
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh user data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Enter guest mode
  const enterGuestMode = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Set guest mode state (temporary, not persisted)
      setIsGuest(true);
      setIsAuthenticated(false);
      setUser(null);
      setHasChannel(false);

      // Note: We don't persist guest mode to AsyncStorage
      // Guest mode should be temporary and reset on app restart
      // This ensures users always see OnboardingScreens first

      Logger.info('AuthContext', 'Entered guest mode (temporary session)');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enter guest mode';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Exit guest mode
  const exitGuestMode = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Clear guest mode state
      setIsGuest(false);
      setIsAuthenticated(false);
      setUser(null);
      setHasChannel(false);

      // Reset premium state to default
      setPremiumState({
        isPremium: false,
        premiumPlanId: 0,
        contentCreatorPlanId: 0,
        walletBalance: '0.00',
      });

      // ✅ SIMPLIFIED: Let navigation state machine handle guest mode exit
      // The state machine will automatically detect the isGuest change and navigate appropriately

      Logger.info('AuthContext', 'Exited guest mode - state cleaned up');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to exit guest mode';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create channel
  const createChannel = async (
    name: string,
    description: string,
  ): Promise<void> => {
    if (!user) {
      setError('User not authenticated');
      throw new Error('User not authenticated');
    }

    setLoading(true); // Operation loading
    setError(null);

    try {
      setHasChannel(true);
      Logger.debug('AuthContext', 'Creating channel:', {name, description});
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create channel';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false); // Operation loading
    }
  };

  // Provide context value - MEMOIZED to prevent unnecessary re-renders
  const contextValue: AuthContextType = useMemo(() => ({
    isAuthenticated,
    isGuest,
    user,
    loading,
    error,
    isInitialized,
    login,
    verifyOtp,
    logout,
    enterGuestMode,
    exitGuestMode,
    updateUserDetails,
    refreshUserData,
    hasChannel,
    createChannel,
    completeOnboarding,
    premiumState,
    setPremiumState,
  }), [
    isAuthenticated,
    isGuest,
    user,
    loading,
    error,
    isInitialized,
    hasChannel,
    premiumState,
    // Note: Functions are stable and don't need to be in deps since they don't change
  ]);

  // Add this to the AuthContext component where user state is managed
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      Logger.info('AuthContext', `🔄 User authenticated, starting services for user ${user.id}`);

      // Start ping service for online status
      LastSeenService.startTracking();

      return () => {
        Logger.debug('AuthContext', '🔄 Cleaning up services on auth context unmount');
        LastSeenService.stopTracking();
      };
    }
  }, [isAuthenticated, user?.id, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
