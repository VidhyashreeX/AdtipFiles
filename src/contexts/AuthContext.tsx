import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI } from "../services/api";
import { toast } from "sonner";
import _ from "lodash"; // Add this import

// Define the UserData interface for type safety
interface UserData {
  id: number;
  name: string;
  firstName: string | null;
  lastName: string | null;
  emailId: string | null;
  mobile_number: string;
  gender: string | null;
  dob: string | null;
  profile_image: string | null;
  profession: string | null;
  maternal_status: string | null;
  address: string | null;
  longitude: string | null;
  latitude: string | null;
  pincode: string | null;
  isOtpVerified: number;
  isSaveUserDetails: number;
  online_status: boolean;
  referal_code: string | null;
  referal_earnings: number;
  bio: string | null;
  premium_plan_id: number;
  content_creator_plan_id: number;
  is_available: boolean;
  dnd: boolean;
  premium: number;
  country_code: string;
  country: string;
  languages: Array<{ id: number; name: string; isPrimary: boolean }>;
  interests: Array<{ id: number; name: string; isPrimary: boolean }>;
  accessToken: string;
  is_premium: boolean;
  channelId: string | null;
  wallet?: number; 
}

// Define the AuthContextType interface
interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  setUser: (user: UserData | null) => void; // Add this line
  login: (phoneNumber: string) => Promise<any>;
  loginWithEmail: (email: string) => Promise<any>;
  verifyOTP: (phoneNumber: string, otp: string, id: string) => Promise<any>;
  verifyEmailOTP: (email: string, otp: string, id: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (userData: Partial<UserData>) => void;
  updateUser: (userData: Partial<UserData>) => void;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("UserLoggedIn");

    // Fix: If user is not set but token exists, try to recover user from tempUserId or UserId
    if (!storedUser && token) {
      const userIdStr = localStorage.getItem("UserId") || localStorage.getItem("tempUserId");
      if (userIdStr) {
        const userId = Number(userIdStr);
        if (!isNaN(userId)) {
          // Set a minimal user object to keep session
          setUser({ id: userId, accessToken: token } as any); // 'as any' to avoid type error for minimal user
          setIsAuthenticated(true);
          // Enhancement: Fetch full user profile and update state/localStorage
          (async () => {
            try {
              // Use the API to fetch user profile
              const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/getuserbyid/${userId}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              if (res.ok) {
                const data = await res.json();
                if (data?.data && Array.isArray(data.data) && data.data[0]) {
                  const userData = data.data[0];
                  // Compose a full user object (add accessToken)
                  const fullUser = { ...userData, accessToken: token };
                  setUser(fullUser);
                  setIsAuthenticated(true);
                  localStorage.setItem("user", JSON.stringify(fullUser));
                }
              }
            } catch (err) {
              // If fetch fails, keep minimal user, but do not log out
              console.error("Failed to fetch full user profile after refresh", err);
            } finally {
              setAuthLoading(false);
            }
          })();
          return;
        }
      }
    }

    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.accessToken) {
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          // If no access token, clear everything
          localStorage.removeItem("user");
          localStorage.removeItem("UserLoggedIn");
        }
      } catch (err) {
        console.error("Error parsing stored user:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("UserLoggedIn");
      }
    }
    setAuthLoading(false);
  }, []);

  // Login function
  const login = async (phoneNumber: string) => {
    try {
      const response = await authAPI.sendOTP(phoneNumber);
      
      if (response.data.status === 200) {
        // Store temporary user ID for OTP verification
        const tempUserId = response.data.data[0]?.id;
        if (tempUserId) {
          localStorage.setItem('tempUserId', tempUserId.toString());
        }
        
        return {
          data: {
            success: true,
            message: response.data.message,
            data: response.data.data
          }
        };
      } else {
        throw new Error(response.data.message || "Failed to send OTP");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Email login function
  const loginWithEmail = async (email: string) => {
    try {
      const response = await authAPI.sendEmailOTP(email);
      if (response.data.status === 200) {
        return {
          data: {
            success: true,
            message: response.data.message,
            data: response.data.data
          }
        };
      } else {
        throw new Error(response.data.message || "Failed to send OTP");
      }
    } catch (error: any) {
      console.error("Email login error:", error);
      throw error;
    }
  };

  // OTP verification function
  const verifyOTP = async (phoneNumber: string, otp: string, id: string) => {
    try {
      const response = await authAPI.verifyOTP(phoneNumber, otp, id);
      
      if (response.data.status !== 200) {
        throw new Error(response.data.message || "OTP verification failed");
      }

      const { accessToken, data } = response.data;
      const userData = {
        ...data[0],
        accessToken,
        channelId: (data[0] as any).channelId || null
      };

      // Store authentication data
      localStorage.setItem('UserLoggedIn', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('UserId', userData.id.toString());
      
      // Clear temporary data
      localStorage.removeItem('tempUserId');
      
      // Update context
      setUser(userData);
      setIsAuthenticated(true);

      return userData;
    } catch (error) {
      // Clear temporary data on error
      localStorage.removeItem('tempUserId');
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (user?.id) {
        await authAPI.logout(user.id.toString());
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
      localStorage.removeItem("UserLoggedIn");
    }
  };

  // Email OTP verification function
  const verifyEmailOTP = async (email: string, otp: string, id: string) => {
    try {
      const response = await authAPI.verifyEmailOTP(email, otp, id);
      
      if (response.data.status === 200) {
        const userData = response.data.data[0];
        const accessToken = response.data.accessToken;

        // Create a standardized user object
        const newUser: UserData = {
          ...userData,
          accessToken,
          channelId: (userData as any).channelId || null,
          mobile_number: userData.mobile_number || "",
          country_code: userData.country_code || "+91",
          country: userData.country || "India",
          referal_earnings: userData.referal_earnings || 0,
          languages: userData.languages || [],
          interests: userData.interests || [],
          is_premium: Boolean(userData.premium),
          isOtpVerified: userData.isOtpVerified || 0,
          isSaveUserDetails: userData.isSaveUserDetails || 0,
          online_status: userData.online_status || false,
          is_available: userData.is_available || true,
          dnd: userData.dnd || false,
          premium: userData.premium || 0,
          premium_plan_id: userData.premium_plan_id || 0,
          content_creator_plan_id: userData.content_creator_plan_id || 0,
          bio: userData.bio || null,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          emailId: userData.emailId || null,
          gender: userData.gender || null,
          dob: userData.dob || null,
          profile_image: userData.profile_image || null,
          profession: userData.profession || null,
          maternal_status: userData.maternal_status || null,
          address: userData.address || null,
          longitude: userData.longitude || null,
          latitude: userData.latitude || null,
          pincode: userData.pincode || null,
          referal_code: userData.referal_code || null
        };

        // Update local storage and state
        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(newUser));
        localStorage.setItem("UserLoggedIn", accessToken);
        
        return {
          data: {
            success: true,
            message: response.data.message,
            data: response.data.data
          }
        };
      } else {
        throw new Error(response.data.message || "Failed to verify OTP");
      }
    } catch (error: any) {
      console.error("Email OTP verification error:", error);
      // Clear any partial auth state on error
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
      localStorage.removeItem("UserLoggedIn");
      throw new Error(error.response?.data?.message || error.message || "Failed to verify OTP");
    }
  };

  // Update user profile function
  const updateUserProfile = (userData: Partial<UserData>) => {
    // console.log('Updating user with:', userData);
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const handleChannelCreation = (channelId: string) => {
    setUser(prev => ({ ...prev, channelId }));
  };

  const updateUser = (userData: Partial<UserData>) => {
    if (user) {
      // Only update if values actually changed
      const currentData = _.pick(user, Object.keys(userData));
      if (!_.isEqual(userData, currentData)) {
        // console.log('Updating user context with new data:', userData); // Debug log
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    }
  };

  const value = {
    user,
    isAuthenticated,
    authLoading,
    setUser, // Add this line
    login,
    loginWithEmail,
    verifyOTP,
    verifyEmailOTP,
    logout,
    updateUserProfile,
    handleChannelCreation,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Create the useAuth hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}