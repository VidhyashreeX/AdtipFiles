
import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  referralEarnings: number;
  id?: string;
  phoneNumber?: string;
  name?: string;
  gender?: string;
  dateOfBirth?: string;
  profession?: string;
  profilePic?: string;
  interests?: string[];
  wallet?: number;
  username?: string;
  bio?: string;
  isPremium?: boolean; // Added isPremium property
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (phoneNumber: string) => void;
  verifyOTP: (otp: string) => Promise<boolean>;
  updateUserProfile: (userData: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("adtip_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("adtip_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("adtip_user");
    }
  }, [user]);

  const login = (phoneNumber: string) => {
    // Store the phone number temporarily during verification
    localStorage.setItem("tempPhone", phoneNumber);
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    // For demo, any 4-digit OTP works
    if (otp.length === 4) {
      const phoneNumber = localStorage.getItem("tempPhone") || "";
      
      // Create a new user account with the phone number
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 15),
        phoneNumber,
        wallet: 0,
        username: "newuser",
        bio: "Welcome to AdTip! Start earning by watching ads and creating content.",
        isPremium: false // Default to non-premium
        ,
        referralEarnings: 0
      };
      
      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.removeItem("tempPhone");
      return true;
    }
    return false;
  };

  const updateUserProfile = (userData: Partial<User>) => {
    setUser((prevUser) => {
      if (prevUser) {
        return { ...prevUser, ...userData };
      }
      return prevUser;
    });
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("adtip_user");
  };

  const value = {
    user,
    isAuthenticated,
    login,
    verifyOTP,
    updateUserProfile,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
