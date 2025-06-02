import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, ENDPOINTS } from '../constants/api';
import ApiService from '../services/ApiService';
import RewardService from '../services/RewardService';

// Define user type
export type User = {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  emailId: string;
  gender: string;
  dob: string;
  profile_image: string | null;
  mobile_number: string;
  profession: string;
  maternal_status: string;
  address: string;
  longitude: string;
  latitude: string;
  pincode: string | null;
  isOtpVerified: number;
  isSaveUserDetails: number;
  online_status: boolean;
  referal_code: string;
  referal_earnings: number;
  referred_by: string | null;
  username: string | null;
  referred_count: number;
  is_first_time: number;
  bio: string | null;
  premium_plan_id: number;
  content_creator_plan_id: number;
  is_available: boolean;
  dnd: boolean;
  premium: number;
  country_code: string;
  country: string;
  languages: any[];
  interests: any[];
  is_premium: boolean;
};

// Define OTP response type
type OtpResponse = {
  otp: string;
  id: number;
  messageId: string;
  mobile_number: string;
  user_type: string;
  isOtpVerified: number;
  is_first_time: boolean;
};

// Define context type
type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  
  // Auth methods
  login: (mobileNumber: string) => Promise<OtpResponse>;
  verifyOtp: (mobileNumber: string, otp: string, id: string) => Promise<User>;
  logout: () => Promise<void>;
  
  // User data methods
  updateUserDetails: (userData: Partial<User>) => Promise<void>;
  refreshUserData: () => Promise<void>;
  
  // Channel methods
  hasChannel: boolean;
  createChannel: (name: string, description: string) => Promise<void>;
};

// Create context
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  login: async () => ({ 
    otp: '', 
    id: 0, 
    messageId: '', 
    mobile_number: '', 
    user_type: '', 
    isOtpVerified: 0, 
    is_first_time: false 
  }),
  verifyOtp: async () => ({} as User),
  logout: async () => {},
  updateUserDetails: async () => {},
  refreshUserData: async () => {},
  hasChannel: false,
  createChannel: async () => {},
});

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChannel, setHasChannel] = useState(false);

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const userJson = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('accessToken');
        
        if (userJson && token) {
          const userData = JSON.parse(userJson) as User;
          setUser(userData);
          setIsAuthenticated(true);
          
          // Check if user has a channel
          checkChannelStatus(userData.id);
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Check if user has a channel
  const checkChannelStatus = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/getchannelbyuserid/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('accessToken')}`
        },
      });
      
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
      const data = await ApiService.post(ENDPOINTS.OTP_LOGIN, {
        mobileNumber,
        userType: '2'
      });
      
      if (data.status !== 200) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      
      return data.data[0];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  // Verify OTP
  const verifyOtp = async (mobileNumber: string, otp: string, id: string): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await ApiService.post(ENDPOINTS.OTP_VERIFY, {
        mobile_number: mobileNumber,
        otp,
        id
      });
      
      if (data.status !== 200) {
        throw new Error(data.message || 'OTP verification failed');
      }
      
      // Save token and user data to storage
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(data.data[0]));
      
      // Update state
      setUser(data.data[0]);
      setIsAuthenticated(true);
      
      // Check if user has a channel
      checkChannelStatus(data.data[0].id);
      
      return data.data[0];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OTP verification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  // Logout
  const logout = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      if (user) {
        // Call logout API
        await ApiService.post(ENDPOINTS.LOGOUT, { id: user.id });
      }
      
      // Clear storage and state regardless of API response
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user');
      
      setUser(null);
      setIsAuthenticated(false);
      setHasChannel(false);
    } catch (err) {
      console.error('Error during logout:', err);
      // Still clear storage and state on error
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user');
      
      setUser(null);
      setIsAuthenticated(false);
      setHasChannel(false);
    } finally {
      setLoading(false);
    }
  };

  // Update user details
  const updateUserDetails = async (userData: Partial<User>): Promise<void> => {
    if (!user) {
      setError('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/saveuserdetails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('accessToken')}`
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
      
      // Update user in storage and state
      const updatedUser = data.data[0];
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user details';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data from API
  const refreshUserData = async (): Promise<void> => {
    if (!user || !isAuthenticated) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Using ping endpoint to refresh user session
      await fetch(`${API_BASE_URL}/api/ping`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('accessToken')}`
        },
      });
      
      // Check if user has a channel
      checkChannelStatus(user.id);
    } catch (err) {
      console.error('Error refreshing user data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create channel
  const createChannel = async (name: string, description: string): Promise<void> => {
    if (!user) {
      setError('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // This would be implemented with a real API in production
      // For now, just update the state
      setHasChannel(true);
      
      // In a real implementation, you would call an API to create the channel
      // and then update the user data
      console.log('Creating channel:', { name, description });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create channel';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Provide context value
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        verifyOtp,
        logout,
        updateUserDetails,
        refreshUserData,
        hasChannel,
        createChannel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
