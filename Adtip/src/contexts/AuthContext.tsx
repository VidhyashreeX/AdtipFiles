import React, {createContext, useState, useContext, useEffect, useMemo} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL, ENDPOINTS} from '../constants/api';
import ApiService from '../services/ApiService';
import {navigationRef} from '../navigation/NavigationService';
import LastSeenService from '../services/LastSeenService'; // Ensure this import is present
import UnifiedCallService from '../services/calling/UnifiedCallService';
import FirebaseService from '../services/FirebaseService';
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
  user: User | null;
  loading: boolean; // For individual operations like login, verifyOtp
  error: string | null;
  isInitialized: boolean; // <-- Add this
  login: (mobileNumber: string) => Promise<ApiResponse<OtpResponse[]>>;  // Updated return type
  verifyOtp: (mobileNumber: string, otp: string, id: string) => Promise<OtpVerifyApiResponse>;
  logout: () => Promise<void>;
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
    setIsAuthenticated(true);
    if (user && user.is_first_time === 1 && user.isSaveUserDetails === 1) { 
         LastSeenService.startTracking();
    }
  };

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // setLoading(true); // No, this loading is for operations, not initialization
        const userJson = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('accessToken');

        if (userJson && token) {
          const userData = JSON.parse(userJson) as User;
          setUser(userData);
          if (userData.is_first_time === 0 || userData.isSaveUserDetails === 1) {
            setIsAuthenticated(true);
          }
          checkChannelStatus(userData.id.toString());
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data');
      } finally {
        // setLoading(false); // Not this loading
        setIsInitialized(true); // <-- Mark as initialized
      }
    };

    loadUser();
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
      console.error('Error checking channel status:', err);
      setHasChannel(false);
    }
  };
  // Login - Send OTP
  const login = async (mobileNumber: string): Promise<ApiResponse<OtpResponse[]>> => {
    setLoading(true);
    setError(null);

    try {
      console.log(`[AuthContext] Attempting login with number: ${mobileNumber}`);
      
      const apiResponse = await ApiService.post<ApiResponse<OtpResponse[]>>(ENDPOINTS.OTP_LOGIN, {
        mobileNumber,
        userType: '2',
      });
      
      console.log('[AuthContext] Login API response:', JSON.stringify(apiResponse));

      if (apiResponse.status !== 200 || !apiResponse.data || !Array.isArray(apiResponse.data) || apiResponse.data.length === 0) {
        throw new Error(apiResponse.message || 'Failed to send OTP or invalid response structure');
      }
      
      // Return the response instead of handling navigation
      return apiResponse;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(errorMessage);
      console.error('[AuthContext] Login error details:', {
        message: errorMessage,
        error: err,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  // Verify OTP
  const verifyOtp = async (mobileNumber: string, otp: string, id: string): Promise<OtpVerifyApiResponse> => {
    try {
      setLoading(true);
      
      const response = await ApiService.verifyOtp({
        mobile_number: mobileNumber,
        otp: otp,
        id: id,
      });

      console.log('AuthContext - OTP verification response:', response);

      // Handle both response formats
      let userData: User | null = null;
      if ('data' in response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        userData = response.data[0];
      } else if ('id' in response && response.id) {
        userData = response as User;
      }

      if (userData && userData.id) {
        // Store user data
        setUser(userData);
        
        // Store user ID and token
        await AsyncStorage.setItem('userId', userData.id.toString());
        await AsyncStorage.setItem('userName', userData.name || '');
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        if (response.accessToken) {
          await AsyncStorage.setItem('accessToken', response.accessToken);
        }

        // Set authentication state - App.tsx will handle navigation based on isSaveUserDetails
        setIsAuthenticated(true);
        
        console.log('AuthContext - User authenticated, isSaveUserDetails:', userData.isSaveUserDetails);
        
        await AsyncStorage.setItem('is_premium', userData.is_premium ? '1' : '0');
        await AsyncStorage.setItem('premium_plan_id', String(userData.premium_plan_id ?? 0));
        await AsyncStorage.setItem('content_creator_plan_id', String(userData.content_creator_plan_id ?? 0));
        // walletBalance is updated after wallet API call
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
      console.error('AuthContext - OTP verification error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  // Logout
  const logout = async (): Promise<void> => {
    // setLoading(true); // This is the AuthContext's general 'loading' state, 
                      // which is fine if you want a global loading indicator for auth operations.
                      // SettingsScreen uses its own 'authLoading' derived from this.
    setError(null);

    const currentUserId = user?.id; // Get user ID before clearing user state

    try {
      LastSeenService.stopTracking();
      
      if (currentUserId) { // Check if there was a user to log out
        console.log(`[AuthContext] Attempting to call API logout for user ID: ${currentUserId}`);
        
        // Use the proper ApiService.logout method which handles FCM token cleanup
        await ApiService.logout(String(currentUserId));
        console.log(`[AuthContext] API logout call successful for user ID: ${currentUserId}`);
      } else {
        console.log('[AuthContext] No user was signed in, proceeding to clear local data.');
      }
      
      // Clean up all services before clearing storage
      try {
        console.log('[AuthContext] Resetting UnifiedCallService...');
        const unifiedCallService = UnifiedCallService.getInstance();
        unifiedCallService.reset();
        
        console.log('[AuthContext] Resetting FirebaseService...');
        const firebaseService = FirebaseService.getInstance();
        firebaseService.reset();
      } catch (serviceError) {
        console.warn('[AuthContext] Error cleaning up services during logout:', serviceError);
      }
      
      await AsyncStorage.clear();
      console.log('[AuthContext] AsyncStorage cleared.');

      setUser(null);
      setIsAuthenticated(false);
      setHasChannel(false);
      setPremiumState({
        isPremium: false,
        premiumPlanId: 0,
        contentCreatorPlanId: 0,
        walletBalance: '0.00',
      });
      console.log('[AuthContext] Local auth state reset.');

      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{name: 'Onboarding'}], // This will take user to Onboarding, then to Login if not skipped
        });
        console.log('[AuthContext] Navigation reset to Onboarding.');
      }
    } catch (err) {
      console.error('[AuthContext] Error during logout:', err);
      // Even if API logout fails, proceed to clear local data and log out locally
      
      // Still try to clean up services
      try {
        const unifiedCallService = UnifiedCallService.getInstance();
        unifiedCallService.reset();
        const firebaseService = FirebaseService.getInstance();
        firebaseService.reset();
      } catch (serviceError) {
        console.warn('[AuthContext] Error cleaning up services during logout fallback:', serviceError);
      }
      
      await AsyncStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
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
  };

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

      const updatedUser = data.data[0];
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
      console.log('No user to refresh.');
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
      console.log('Creating channel:', {name, description});
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
    user,
    loading,
    error,
    isInitialized,
    login,
    verifyOtp,
    logout,
    updateUserDetails,
    refreshUserData,
    hasChannel,
    createChannel,
    completeOnboarding,
    premiumState,
    setPremiumState,
  }), [
    isAuthenticated,
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
      console.log(`🔄 User authenticated, starting ping service for user ${user.id}`);
      LastSeenService.startTracking();
      
      return () => {
        console.log('🔄 Cleaning up ping service on auth context unmount');
        LastSeenService.stopTracking();
      };
    }
  }, [isAuthenticated, user?.id]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
