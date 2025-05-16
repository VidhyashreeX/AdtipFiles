import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiSendOtp, apiVerifyOtp } from "../api";

// Define the UserData interface for type safety
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

// Define the AuthContextType interface
interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  login: (phone: string) => Promise<any>;
  verifyOTP: (otp: string, id: string) => Promise<{ success: boolean; data?: any; message?: string }>;
  updateUserProfile: (profileData: Partial<UserData>) => void;
  logout: () => UserData;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("adtip_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("Loaded user from localStorage:", JSON.stringify(parsedUser, null, 2));
        setUser(parsedUser);
        setIsAuthenticated(!!parsedUser.accessToken);
      } catch (err) {
        console.error("Failed to parse adtip_user from localStorage:", err);
        localStorage.removeItem("adtip_user");
      }
    } else {
      console.log("No user found in localStorage");
    }
  }, []);

  const login = async (phone: string) => {
    try {
      if (!phone) {
        throw new Error("Phone number is required");
      }
      console.log("AuthContext login called with:", { phone });

      const res = await apiSendOtp(phone);
      console.log("apiSendOtp response:", JSON.stringify(res, null, 2));

      const userData = res.data
        ? Array.isArray(res.data)
          ? res.data[0]
          : res.data
        : res;

      if (!userData.id || !userData.mobile_number) {
        console.error("Invalid API response, missing id or mobile_number:", res);
        throw new Error("Invalid response from server: missing id or mobile_number");
      }

      const newUser: UserData = {
        id: userData.id?.toString(),
        phone: userData.mobile_number.replace(/\D/g, "").slice(-10) || phone,
        accessToken: null,
        isRegistered: userData.isSaveUserDetails === 1,
        username: userData.username || userData.name || "newuser",
        bio: userData.bio || "Welcome to AdTip!",
        wallet: userData.referal_earnings || 0,
        isPremium: userData.is_premium || userData.premium_plan_id !== 0 || false,
        referralEarnings: userData.referal_earnings || 0,
        name: userData.name || "",
        email: userData.emailId || "",
        gender: userData.gender || "",
        dateOfBirth: userData.dob || "",
        profession: userData.profession || "",
        profilePic: userData.profile_image || "",
        interests: userData.interests?.map((i: { name: string }) => i.name) || [],
        maritalStatus: userData.maternal_status || "",
        languages: userData.languages?.[0]?.name || "",
      };

      console.log("Setting user in AuthContext:", JSON.stringify(newUser, null, 2));
      setUser(newUser);
      localStorage.setItem("adtip_user", JSON.stringify(newUser));
      localStorage.setItem("mobile_number", newUser.phone);
      localStorage.setItem("tempUserId", newUser.id);
      return res;
    } catch (err: any) {
      console.error("OTP sending failed:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
        rawResponse: err.response ? JSON.stringify(err.response, null, 2) : "No response",
      });
      throw new Error(err.message || "Failed to send OTP");
    }
  };

  const verifyOTP = async (otp: string, id: string): Promise<{ success: boolean; data?: any; message?: string }> => {
    const mobile_number = localStorage.getItem("mobile_number") || user?.phone || "";
    if (!mobile_number || !id) {
      console.error("Missing mobile_number or id:", { mobile_number, id });
      throw new Error("Missing mobile number or ID");
    }

    try {
      console.log("AuthContext verifyOTP called with:", { mobile_number, otp, id });
      const res = await apiVerifyOtp(mobile_number, otp, id);
      console.log("apiVerifyOtp response:", JSON.stringify(res, null, 2));

      if (res.status === 200 || res.success) {
        const userData = res.data
          ? Array.isArray(res.data)
            ? res.data[0]
            : res.data
          : res;

        const newUser: UserData = {
          id: userData.id?.toString() || `user_${Date.now()}`,
          phone: mobile_number,
          accessToken: userData.accessToken || res.accessToken || null,
          isRegistered: userData.isSaveUserDetails === 1,
          username: userData.username || userData.name || user?.username || "newuser",
          bio: userData.bio || user?.bio || "Welcome to AdTip!",
          wallet: userData.referal_earnings || user?.wallet || 0,
          isPremium: userData.is_premium || userData.premium_plan_id !== 0 || user?.isPremium || false,
          referralEarnings: userData.referal_earnings || user?.referralEarnings || 0,
          name: userData.name || user?.name || "",
          gender: userData.gender || user?.gender || "",
          dateOfBirth: userData.dob || user?.dateOfBirth || "",
          profession: userData.profession || user?.profession || "",
          profilePic: userData.profile_image || user?.profilePic || "",
          interests: userData.interests?.map((i: { name: string }) => i.name) || user?.interests || [],
          email: userData.emailId || user?.email || "",
          maritalStatus: userData.maternal_status || user?.maritalStatus || "",
          languages: userData.languages?.[0]?.name || user?.languages || "",
        };

        console.log("Setting user after OTP verification:", JSON.stringify(newUser, null, 2));
        setUser(newUser);
        localStorage.setItem("adtip_user", JSON.stringify(newUser));
        setIsAuthenticated(true);
        localStorage.removeItem("tempUserId");
        localStorage.removeItem("mobile_number");
        return { success: true, data: userData };
      }

      console.warn("apiVerifyOtp failed with status:", res.status);
      return { success: false, message: res.message || "Invalid OTP" };
    } catch (err: any) {
      console.error("OTP verification failed:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
        rawResponse: err.response ? JSON.stringify(err.response, null, 2) : "No response",
      });
      throw new Error(err.message || "Failed to verify OTP");
    }
  };

  const updateUserProfile = (profileData: Partial<UserData>) => {
    setUser((prevUser) => {
      const updatedUser: UserData = {
        id: prevUser?.id || profileData.id || `temp_${Date.now()}`,
        phone: prevUser?.phone || profileData.phone || "",
        accessToken: prevUser?.accessToken || profileData.accessToken || null,
        isRegistered: prevUser?.isRegistered ?? profileData.isRegistered ?? false,
        username: prevUser?.username || profileData.username || "newuser",
        bio: prevUser?.bio || profileData.bio || "Welcome to AdTip!",
        wallet: prevUser?.wallet ?? profileData.wallet ?? 0,
        isPremium: prevUser?.isPremium ?? profileData.isPremium ?? false,
        referralEarnings: prevUser?.referralEarnings ?? profileData.referralEarnings ?? 0,
        name: prevUser?.name || profileData.name || "",
        gender: prevUser?.gender || profileData.gender || "",
        dateOfBirth: prevUser?.dateOfBirth || profileData.dateOfBirth || "",
        profession: prevUser?.profession || profileData.profession || "",
        profilePic: prevUser?.profilePic || profileData.profilePic || "",
        interests: profileData.interests || prevUser?.interests || [],
        email: prevUser?.email || profileData.email || "",
        maritalStatus: prevUser?.maritalStatus || profileData.maritalStatus || "",
        languages: prevUser?.languages || profileData.languages || "",
      };
      console.log("Updating user profile:", JSON.stringify(updatedUser, null, 2));
      localStorage.setItem("adtip_user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const logout = () => {
    console.log("Logging out user:", user);
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
      name: "",
      email: "",
      gender: "",
      dateOfBirth: "",
      profession: "",
      profilePic: "",
      interests: [],
      maritalStatus: "",
      languages: "",
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