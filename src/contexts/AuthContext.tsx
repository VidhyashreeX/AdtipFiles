import { createContext, useContext, useState, ReactNode } from "react";
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
  gender?: string;
  dateOfBirth?: string;
  profession?: string;
  profilePic?: string;
  interests?: string[];
  maritalStatus?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (phone: string) => Promise<any>;
  logout: () => UserData;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const login = async (phone: string) => {
    const response = await apiSendOtp(phone);
    if (response.status === 200) {
      setIsAuthenticated(true);
    }
    return response;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("tempUserId");
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
      maritalStatus: undefined,
    };
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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