import React, {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  name: string;
  email: string;
  hasChannel: boolean;
  channelName?: string;
  channelDescription?: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  hasChannel: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  createChannel: (name: string, description: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  hasChannel: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  createChannel: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [hasChannel, setHasChannel] = useState(false);

  useEffect(() => {
    // Load user data from AsyncStorage on app start
    const loadUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const userData = JSON.parse(userString);
          setUser(userData);
          setIsAuthenticated(true);
          setHasChannel(userData.hasChannel || false);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    // This is a mock implementation. In a real app, you would call your API
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user data - in a real app this would come from your API
      const userData: User = {
        id: 'user_' + new Date().getTime(),
        name: 'Test User', // In a real app, this would come from the backend
        email,
        hasChannel: false,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      setHasChannel(userData.hasChannel);
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed. Please try again.');
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    // This is a mock implementation. In a real app, you would call your API
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user data - in a real app this would come from your API
      const userData: User = {
        id: 'user_' + new Date().getTime(),
        name,
        email,
        hasChannel: false,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      setHasChannel(false);
    } catch (error) {
      console.error('Signup error:', error);
      throw new Error('Signup failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      setHasChannel(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed. Please try again.');
    }
  };

  const createChannel = async (name: string, description: string) => {
    try {
      if (!user) {
        throw new Error('User must be logged in to create a channel');
      }

      // Update user data with channel info
      const updatedUser: User = {
        ...user,
        hasChannel: true,
        channelName: name,
        channelDescription: description,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      // Update state
      setUser(updatedUser);
      setHasChannel(true);
    } catch (error) {
      console.error('Create channel error:', error);
      throw new Error('Failed to create channel. Please try again.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        hasChannel,
        login,
        signup,
        logout,
        createChannel,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export {AuthContext};
