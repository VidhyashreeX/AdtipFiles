import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiSendOtp, apiVerifyOtp, apiSendEmailOtp, apiVerifyEmailOtp, apiGoogleSSO } from "../api";
import { toast } from "sonner";

// Define the UserData interface for type safety
interface UserData {
  id: number;
  name: string;
  phone: string;
  email: string;
  accessToken: string;
  isRegistered: boolean;
  isSaveUserDetails?: number;
}

// Define the AuthContextType interface
interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  login: (phoneNumber: string) => Promise<any>;
  loginWithEmail: (email: string) => Promise<any>;
  loginWithGoogle: (token: string) => Promise<any>;
  verifyOTP: (phoneNumber: string, otp: string, id: string) => Promise<any>;
  verifyEmailOTP: (email: string, otp: string, id: string) => Promise<any>;
  logout: () => void;
  updateUserProfile: (userData: UserData) => void;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the useAuth hook
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(Boolean(parsedUser?.accessToken));
        console.log("Loaded user state:", { 
          isAuthenticated: Boolean(parsedUser?.accessToken),
          userId: parsedUser?.id,
          token: parsedUser?.accessToken
        });
      } catch (err) {
        console.error("Error parsing stored user:", err);
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Update user profile function
  const updateUserProfile = (userData: UserData) => {
    setUser(userData);
    setIsAuthenticated(Boolean(userData?.accessToken));
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const login = async (phoneNumber: string) => {
    try {
      const response = await apiSendOtp(phoneNumber);
      if (!response?.data?.success && response?.data?.message !== "OTP sent on registered mobile number.") {
        throw new Error(response?.data?.message || "Failed to send OTP");
      }
      return response;
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.response?.data?.message || error.message || "Failed to send OTP");
    }
  };

  const loginWithEmail = async (email: string) => {
    try {
      const response = await apiSendEmailOtp(email);
      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to send OTP");
      }
      return response;
    } catch (error: any) {
      console.error("Email login error:", error);
      throw new Error(error.response?.data?.message || error.message || "Failed to send OTP");
    }
  };

  const loginWithGoogle = async (token: string) => {
    try {
      const response = await apiGoogleSSO(token);
      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to authenticate with Google");
      }

      const userData = response.data.data;
      const newUser: UserData = {
        id: userData.id,
        name: userData.name || "",
        phone: userData.mobile_number || "",
        email: userData.email || "",
        accessToken: userData.access_token,
        isRegistered: userData.is_registered === 1
      };

      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(newUser));
      return response;
    } catch (error: any) {
      console.error("Google login error:", error);
      throw new Error(error.response?.data?.message || error.message || "Failed to authenticate with Google");
    }
  };

  const verifyOTP = async (phoneNumber: string, otp: string, id: string) => {
    try {
      const response = await apiVerifyOtp(phoneNumber, otp, id);
      
      // Consider both success flag and successful message
      if (response?.data?.success || response?.data?.message === "OTP verify successful.") {
        const userData = response.data.data;
        const newUser: UserData = {
          id: userData.id,
          name: userData.name || "",
          phone: userData.mobile_number,
          email: userData.email || "",
          accessToken: userData.access_token,
          isRegistered: userData.is_registered === 1
        };

        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(newUser));
        return response;
      } else {
        throw new Error(response?.data?.message || "Failed to verify OTP");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      throw new Error(error.response?.data?.message || error.message || "Failed to verify OTP");
    }
  };

  const verifyEmailOTP = async (email: string, otp: string, id: string) => {
    try {
      const response = await apiVerifyEmailOtp(email, otp, id);
      
      if (response?.data?.success) {
        const userData = response.data.data;
        const newUser: UserData = {
          id: userData.id,
          name: userData.name || "",
          phone: userData.mobile_number || "",
          email: userData.email,
          accessToken: userData.access_token,
          isRegistered: userData.is_registered === 1
        };

        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(newUser));
        return response;
      } else {
        throw new Error(response?.data?.message || "Failed to verify OTP");
      }
    } catch (error: any) {
      console.error("Email OTP verification error:", error);
      throw new Error(error.response?.data?.message || error.message || "Failed to verify OTP");
    }
  };

  const logout = () => {
    console.log("Logging out user:", user);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    localStorage.removeItem("tempUserId");
    localStorage.removeItem("mobile_number");
    localStorage.removeItem("email");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        loginWithEmail,
        loginWithGoogle,
        verifyOTP,
        verifyEmailOTP,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth };