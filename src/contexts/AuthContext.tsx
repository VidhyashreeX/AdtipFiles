import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiSendOtp, apiVerifyOtp } from "../api";

interface UserData {
  id: string;
  phone: string;
  accessToken: string | null;
  isRegistered: boolean;
  username: string;
  bio: string;
  wallet: number;
  isPremium: boolean;
  referralEarnings: number;
  name?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  profession?: string;
  profilePic?: string;
  interests?: string[];
  maritalStatus?: string;
}

interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  login: (phone: string) => Promise<any>;
  verifyOTP: (otp: string) => Promise<boolean>;
  updateUserProfile: (profileData: Partial<UserData>) => void;
  logout: () => UserData;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("adtip_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser((prevUser) => {
        if (JSON.stringify(prevUser) !== JSON.stringify(parsedUser)) {
          return parsedUser;
        }
        return prevUser;
      });
      setIsAuthenticated(true);
    }
  }, []); // Empty dependency array to run only on mount

  const login = async (phone: string) => {
    try {
      if (!phone) {
        throw new Error("Phone number is required");
      }
      const res = await apiSendOtp(phone);
      console.log("apiSendOtp response:", res);

      // Store id and mobile_number in localStorage
      const userId = res.data?.[0]?.id?.toString();
      const mobile_number = res.data?.[0]?.mobile_number || phone;
      if (userId && mobile_number) {
        localStorage.setItem("tempUserId", userId);
        localStorage.setItem("mobile_number", mobile_number);
      }

      const newUser: UserData = {
        id: userId || Math.random().toString(36).substring(2, 15),
        phone: mobile_number,
        accessToken: null,
        isRegistered: res.data?.[0]?.isSaveUserDetails === 1 || false,
        username: "newuser",
        bio: "Welcome to AdTip!",
        wallet: 0,
        isPremium: false,
        referralEarnings: 0,
        interests: [],
      };
      console.log("Setting user in AuthContext:", newUser);
      setUser(newUser);
      localStorage.setItem("adtip_user", JSON.stringify(newUser));
      setIsAuthenticated(true);
      return res;
    } catch (err: any) {
      console.error("OTP sending failed", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      throw err;
    }
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    const mobile_number = localStorage.getItem("mobile_number") || "";
    const tempUserId = localStorage.getItem("tempUserId") || user?.id || "0";
    try {
      const res = await apiVerifyOtp(mobile_number, otp, tempUserId);
      console.log("apiVerifyOtp response:", res);
      if (res.status === 200) {
        const userData = res.data?.[0] || {};
        const newUser: UserData = {
          id: userData.id?.toString() || user?.id || Math.random().toString(36).substring(2, 15),
          phone: mobile_number,
          accessToken: res.accessToken || null,
          isRegistered: userData.isSaveUserDetails === 1,
          username: userData.username || userData.name || "newuser",
          bio: userData.bio || "Welcome to AdTip! Start earning by watching ads and creating content.",
          wallet: userData.referal_earnings || 0,
          isPremium: userData.is_premium || userData.premium_plan_id !== 0 || false,
          referralEarnings: userData.referal_earnings || 0,
          name: userData.name,
          gender: userData.gender,
          dateOfBirth: userData.dob,
          profession: userData.profession,
          profilePic: userData.profile_image,
          interests: userData.interests?.map((i: { name: string }) => i.name) || [],
          email: userData.email || "",
          maritalStatus: userData.maritalStatus || "",
        };
        console.log("Setting user after OTP verification:", newUser);
        setUser(newUser);
        localStorage.setItem("adtip_user", JSON.stringify(newUser));
        setIsAuthenticated(true);
        localStorage.removeItem("tempUserId");
        localStorage.removeItem("mobile_number");
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

  const updateUserProfile = (profileData: Partial<UserData>) => {
    setUser((prevUser) => {
      const updatedUser: UserData = {
        id: prevUser?.id || profileData.id || Math.random().toString(36).substring(2, 15),
        phone: prevUser?.phone || profileData.phone || "",
        accessToken: prevUser?.accessToken || profileData.accessToken || null,
        isRegistered: prevUser?.isRegistered ?? profileData.isRegistered ?? false,
        username: prevUser?.username || profileData.username || "newuser",
        bio: prevUser?.bio || profileData.bio || "Welcome to AdTip!",
        wallet: prevUser?.wallet ?? profileData.wallet ?? 0,
        isPremium: prevUser?.isPremium ?? profileData.isPremium ?? false,
        referralEarnings: prevUser?.referralEarnings ?? profileData.referralEarnings ?? 0,
        name: prevUser?.name || profileData.name,
        gender: prevUser?.gender || profileData.gender,
        dateOfBirth: prevUser?.dateOfBirth || profileData.dateOfBirth,
        profession: prevUser?.profession || profileData.profession,
        profilePic: prevUser?.profilePic || profileData.profilePic,
        interests: profileData.interests || prevUser?.interests || [],
        email: prevUser?.email || profileData.email || "",
        maritalStatus: prevUser?.maritalStatus || profileData.maritalStatus || "",
      };
      localStorage.setItem("adtip_user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("adtip_user");
    localStorage.removeItem("tempUserId");
    localStorage.removeItem("mobile_number");
    return {
      id: "",
      phone: "",
      accessToken: null,
      isRegistered: false,
      username: "newuser",
      bio: "Welcome to AdTip!",
      wallet: 0,
      isPremium: false,
      referralEarnings: 0,
      name: undefined,
      gender: undefined,
      dateOfBirth: undefined,
      profession: undefined,
      profilePic: undefined,
      interests: undefined,
      email: undefined,
      maritalStatus: undefined,
    };
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, verifyOTP, updateUserProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};