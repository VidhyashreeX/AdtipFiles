import React, { createContext, useContext, useState, useEffect } from "react";
import { apiSendOtp, apiVerifyOtp } from "../api";

interface User {
  id?: string;
  phoneNumber?: string;
  wallet?: number;
  username?: string;
  bio?: string;
  isPremium?: boolean;
  referralEarnings: number;
  isRegistered?: boolean;
  name?: string;
  gender?: string;
  dateOfBirth?: string;
  profession?: string;
  profilePic?: string;
  interests?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (phoneNumber: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<boolean>;
  updateUserProfile: (userData: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("adtip_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("adtip_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("adtip_user");
    }
  }, [user]);

  const login = async (phoneNumber: string): Promise<void> => {
    try {
      const res = await apiSendOtp(phoneNumber);
      localStorage.setItem("tempPhone", phoneNumber);
      if (res.id) {
        localStorage.setItem("tempUserId", res.id);
      }
      setUser({
        phoneNumber,
        id: res.id || Math.random().toString(36).substring(2, 15),
        wallet: 0,
        username: "newuser",
        bio: "Welcome to AdTip!",
        isPremium: false,
        referralEarnings: 0,
        isRegistered: res.isRegistered || false,
      });
    } catch (err: any) {
      console.error("OTP sending failed", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      throw new Error(
        err.response?.status === 404
          ? "Unable to connect to OTP service. Please try again later."
          : err.response?.data?.error || err.message || "Could not send OTP. Please try again."
      );
    }
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    const phoneNumber = localStorage.getItem("tempPhone") || "";
    const tempUserId = localStorage.getItem("tempUserId") || user?.id || "0";
    try {
      const res = await apiVerifyOtp(phoneNumber, otp, tempUserId);
      if (res.status === 200) {
        const newUser: User = {
          id: res.id || user?.id || Math.random().toString(36).substring(2, 15),
          phoneNumber,
          wallet: res.wallet || 0,
          username: res.username || "newuser",
          bio: res.bio || "Welcome to AdTip! Start earning by watching ads and creating content.",
          isPremium: res.isPremium || false,
          referralEarnings: res.referralEarnings || 0,
          isRegistered: res.isRegistered !== undefined ? res.isRegistered : true,
          name: res.name,
          gender: res.gender,
          dateOfBirth: res.dateOfBirth,
          profession: res.profession,
          profilePic: res.profilePic,
          interests: res.interests,
        };
        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.removeItem("tempPhone");
        localStorage.removeItem("tempUserId");
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("OTP verification failed", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      return false;
    }
  };

  const updateUserProfile = (userData: Partial<User>) => {
    setUser((prevUser) => (prevUser ? { ...prevUser, ...userData } : prevUser));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("adtip_user");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    verifyOTP,
    updateUserProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};