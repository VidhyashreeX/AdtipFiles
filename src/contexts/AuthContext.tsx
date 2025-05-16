import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  languages?: string;
}

interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  login: (phone: string) => Promise<any>;
  verifyOTP: (otp: string) => Promise<{ success: boolean; data?: any }>;
  updateUserProfile: (profileData: Partial<UserData>) => void;
  logout: () => UserData;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("adtip_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log("Loaded user from localStorage:", parsedUser);
      setUser(parsedUser);
      // Only consider authenticated if user has a valid accessToken
      setIsAuthenticated(!!parsedUser && !!parsedUser.accessToken);
    } else {
      console.log("No user found in localStorage");
    }
  }, []);

  const login = async (phone: string) => {
    try {
      if (!phone) {
        throw new Error("Phone number is required");
      }
      const res = await apiSendOtp(phone);
      console.log("apiSendOtp response:", res);

      const userData = res.data
        ? Array.isArray(res.data)
          ? res.data[0]
          : res.data
        : {};
      if (!userData.id || !userData.mobile_number) {
        console.warn("Invalid API response, missing id or mobile_number:", res);
        throw new Error("Invalid response from server");
      }
      const newUser: UserData = {
        id: userData.id.toString(),
        phone: userData.mobile_number,
        accessToken: null,
        isRegistered: userData.isSaveUserDetails === 1,
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

  const verifyOTP = async (otp: string): Promise<{ success: boolean; data?: any }> => {
    const mobile_number = localStorage.getItem("mobile_number") || user?.phone || "";
    const tempUserId = localStorage.getItem("tempUserId") || user?.id || "";
    if (!mobile_number || !tempUserId) {
      throw new Error("Missing mobile number or user ID");
    }

    try {
      const res = await apiVerifyOtp(mobile_number, otp, tempUserId);
      console.log("apiVerifyOtp response:", res);
      if (res.status === 200) {
        const userData = res.data
          ? Array.isArray(res.data)
            ? res.data[0]
            : res.data
          : {};
        const newUser: UserData = {
          id: userData.id?.toString() || tempUserId,
          phone: mobile_number,
          accessToken: res.accessToken || null,
          isRegistered: userData.isSaveUserDetails === 1,
          username: userData.username || userData.name || "newuser",
          bio: userData.bio || "Welcome to AdTip!",
          wallet: userData.referal_earnings || 0,
          isPremium: userData.is_premium || userData.premium_plan_id !== 0,
          referralEarnings: userData.referal_earnings || 0,
          name: userData.name,
          gender: userData.gender,
          dateOfBirth: userData.dob,
          profession: userData.profession,
          profilePic: userData.profile_image,
          interests: userData.interests?.map((i: { name: string }) => i.name) || [],
          email: userData.emailId || "",
          maritalStatus: userData.maternal_status || "",
          languages: userData.languages?.[0]?.name || "",
        };
        console.log("Setting user after OTP verification:", newUser);
        setUser(newUser);
        localStorage.setItem("adtip_user", JSON.stringify(newUser));
        setIsAuthenticated(true);
        localStorage.removeItem("tempUserId");
        localStorage.removeItem("mobile_number");
        return { success: true, data: userData };
      }
      console.warn("apiVerifyOtp failed with status:", res.status);
      return { success: false };
    } catch (err: any) {
      console.error("OTP verification failed", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      throw err;
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
        languages: prevUser?.languages || profileData.languages || "",
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