import React, { createContext, useContext, useState, useEffect } from "react";
import { apiSendOtp, apiVerifyOtp } from "../api";
import { useUser } from "../UserContext";

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
  login: (phoneNumber: string) => Promise<any>;
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
  const { setUser: setUserContext } = useUser();

  useEffect(() => {
    const storedUser = localStorage.getItem("adtip_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setUserContext({
        id: parsedUser.id,
        phone: parsedUser.phoneNumber,
        accessToken: null,
        isRegistered: parsedUser.isRegistered,
        username: parsedUser.username,
        bio: parsedUser.bio,
        wallet: parsedUser.wallet,
        isPremium: parsedUser.isPremium,
        referralEarnings: parsedUser.referralEarnings,
        name: parsedUser.name,
        gender: parsedUser.gender,
        dateOfBirth: parsedUser.dateOfBirth,
        profession: parsedUser.profession,
        profilePic: parsedUser.profilePic,
        interests: parsedUser.interests,
      });
      setIsAuthenticated(true);
    }
  }, [setUserContext]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("adtip_user", JSON.stringify(user));
      setUserContext({
        id: user.id || null,
        phone: user.phoneNumber || null,
        accessToken: null,
        isRegistered: user.isRegistered,
        username: user.username,
        bio: user.bio,
        wallet: user.wallet,
        isPremium: user.isPremium,
        referralEarnings: user.referralEarnings,
        name: user.name,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        profession: user.profession,
        profilePic: user.profilePic,
        interests: user.interests,
      });
    } else {
      localStorage.removeItem("adtip_user");
    }
  }, [user, setUserContext]);

  const login = async (phoneNumber: string): Promise<any> => {
    try {
      const res = await apiSendOtp(phoneNumber);
      console.log("apiSendOtp response:", res);
      localStorage.setItem("tempPhone", phoneNumber);
      if (res.id) {
        localStorage.setItem("tempUserId", res.id);
      }
      const newUser = {
        phoneNumber,
        id: res.id || Math.random().toString(36).substring(2, 15),
        wallet: 0,
        username: "newuser",
        bio: "Welcome to AdTip!",
        isPremium: false,
        referralEarnings: 0,
        isRegistered: res.isRegistered || false,
      };
      console.log("Setting user in AuthContext:", newUser);
      setUser(newUser);
      setUserContext({
        id: newUser.id,
        phone: phoneNumber,
        accessToken: null,
        isRegistered: newUser.isRegistered,
        username: newUser.username,
        bio: newUser.bio,
        wallet: newUser.wallet,
        isPremium: newUser.isPremium,
        referralEarnings: newUser.referralEarnings,
      });
      return res;
    } catch (err: any) {
      console.error("OTP sending failed", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      throw new Error(
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.status === 500
          ? "Server error: Database issue. Please try again later."
          : "Could not send OTP. Please try again.")
      );
    }
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    const phoneNumber = localStorage.getItem("tempPhone") || "";
    const tempUserId = localStorage.getItem("tempUserId") || user?.id || "0";
    try {
      const res = await apiVerifyOtp(phoneNumber, otp, tempUserId);
      console.log("apiVerifyOtp response:", res);
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
        console.log("Setting user after OTP verification:", newUser);
        setUser(newUser);
        setUserContext({
          id: newUser.id,
          phone: phoneNumber,
          accessToken: res.accessToken || null,
          isRegistered: newUser.isRegistered,
          username: newUser.username,
          bio: newUser.bio,
          wallet: newUser.wallet,
          isPremium: newUser.isPremium,
          referralEarnings: newUser.referralEarnings,
          name: newUser.name,
          gender: newUser.gender,
          dateOfBirth: newUser.dateOfBirth,
          profession: newUser.profession,
          profilePic: newUser.profilePic,
          interests: newUser.interests,
        });
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
    setUser((prevUser) => {
      const updatedUser = prevUser ? { ...prevUser, ...userData } : prevUser;
      if (updatedUser) {
        setUserContext({
          id: updatedUser.id || null,
          phone: updatedUser.phoneNumber || null,
          accessToken: null,
          isRegistered: updatedUser.isRegistered,
          username: updatedUser.username,
          bio: updatedUser.bio,
          wallet: updatedUser.wallet,
          isPremium: updatedUser.isPremium,
          referralEarnings: updatedUser.referralEarnings,
          name: updatedUser.name,
          gender: updatedUser.gender,
          dateOfBirth: updatedUser.dateOfBirth,
          profession: updatedUser.profession,
          profilePic: updatedUser.profilePic,
          interests: updatedUser.interests,
        });
      }
      return updatedUser;
    });
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setUserContext({ id: null, accessToken: null, phone: null });
    localStorage.removeItem("adtip_user");
    localStorage.removeItem("user");
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