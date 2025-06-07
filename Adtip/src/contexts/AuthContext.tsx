import React, {createContext, useState, useContext, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL, ENDPOINTS} from '../constants/api';
import ApiService from '../services/ApiService';
import {navigationRef} from '../navigation/NavigationService';
import LastSeenService from '../services/LastSeenService'; // Ensure this import is present
import { ApiResponse, OtpLoginResponse as ApiOtpResponse, User as ApiUserType } from '../types/api';

// Define user type (using the one from api.ts for consistency)
export type User = ApiUserType; // Assuming ApiUserType from types/api.ts is the correct User type

type OtpResponse = ApiOtpResponse;


// Define context type
type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean; // For individual operations like login, verifyOtp
  error: string | null;
  isInitialized: boolean; // <-- Add this
  login: (mobileNumber: string) => Promise<OtpResponse>;
  verifyOtp: (mobileNumber: string, otp: string, id: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUserDetails: (userData: Partial<User>) => Promise<void>;
  refreshUserData: () => Promise<void>;
  hasChannel: boolean;
  createChannel: (name: string, description: string) => Promise<void>;
  completeOnboarding: () => void;
};

// Create context
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: false, // Default operation loading to false
  error: null,
  isInitialized: false, // <-- Default to false
  login: async () => ({}) as OtpResponse,
  verifyOtp: async () => ({}) as User,
  logout: async () => {},
  updateUserDetails: async () => {},
  refreshUserData: async () => {},
  hasChannel: false,
  createChannel: async () => {},
  completeOnboarding: () => {},
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
          checkChannelStatus(userData.id);
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
  const login = async (mobileNumber: string): Promise<OtpResponse> => {
    setLoading(true);
    setError(null);

    try {
      console.log(`[AuthContext] Attempting login with number: ${mobileNumber}`);
      console.log(`[AuthContext] API_BASE_URL: ${API_BASE_URL}`);
      
      const apiResponse = await ApiService.post<ApiResponse<OtpResponse[]>>(ENDPOINTS.OTP_LOGIN, {
        mobileNumber,
        userType: '2',
      });
      
      console.log('[AuthContext] Login API response:', JSON.stringify(apiResponse));

      if (apiResponse.status !== 200 || !apiResponse.data || !Array.isArray(apiResponse.data) || apiResponse.data.length === 0) {
        throw new Error(apiResponse.message || 'Failed to send OTP or invalid response structure');
      }
      return apiResponse.data[0];
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
  const verifyOtp = async (
    mobileNumber: string,
    otp: string,
    id: string,
  ): Promise<User> => {
    setLoading(true); // Operation loading
    setError(null);

    try {
      type VerifyOtpApiResponse = ApiResponse<User[]> & { accessToken?: string };
      const verifyResponse = await ApiService.post<VerifyOtpApiResponse>(ENDPOINTS.OTP_VERIFY, {
        mobile_number: mobileNumber,
        otp,
        id,
      });


      if (verifyResponse.status !== 200 || !verifyResponse.data || !Array.isArray(verifyResponse.data) || verifyResponse.data.length === 0) {
        throw new Error(verifyResponse.message || 'OTP verification failed');
      }
      
      const userData = verifyResponse.data[0];
      if (verifyResponse.accessToken) { 
        await AsyncStorage.setItem('accessToken', verifyResponse.accessToken);
      } else {
        console.warn('[AuthContext] AccessToken not found in verifyOtp response');
      }
      await AsyncStorage.setItem('user', JSON.stringify(userData));


      setUser(userData);
      
      if (userData.is_first_time === 0) {
        setIsAuthenticated(true);
        LastSeenService.startTracking(); 
      }

      checkChannelStatus(userData.id);

      return userData;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'OTP verification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false); // Operation loading
    }
  };
  // Logout
  const logout = async (): Promise<void> => {
    setLoading(true); // Operation loading
    setError(null);

    try {
      LastSeenService.stopTracking();
      
      if (user) {
        await ApiService.post(ENDPOINTS.LOGOUT, {id: user.id});
      }
      await AsyncStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      setHasChannel(false);
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{name: 'Onboarding'}],
        });
      }
    } catch (err) {
      console.error('Error during logout:', err);
      await AsyncStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      setHasChannel(false);
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{name: 'Onboarding'}],
        });
      }
    } finally {
      setLoading(false); // Operation loading
    }
  };

  // Update user details
  const updateUserDetails = async (userData: Partial<User>): Promise<void> => {
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
    if (!user || !isAuthenticated) {
      return;
    }

    setLoading(true); // Operation loading

    try {
      await fetch(`${API_BASE_URL}/api/ping`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
        },
      });

      checkChannelStatus(user.id);
    } catch (err) {
      console.error('Error refreshing user data:', err);
    } finally {
      setLoading(false); // Operation loading
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

  // Provide context value
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading, // This is for operations
        error,
        isInitialized, // <-- Provide this
        login,
        verifyOtp,
        logout,
        updateUserDetails,
        refreshUserData,
        hasChannel,
        createChannel,
        completeOnboarding,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
