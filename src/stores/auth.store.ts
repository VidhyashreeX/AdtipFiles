// src/stores/auth.store.ts - World-class authentication state management
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { authAPI } from '../services/api';
import _ from 'lodash';

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

interface AuthState {
  // State
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Computed properties
  isPremium: boolean;
  hasChannel: boolean;
  userId: number | null;
  isNewUser: boolean;
  hasProfile: boolean;

  // Actions
  setUser: (user: UserData | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  login: (phoneNumber: string) => Promise<any>;
  loginWithEmail: (email: string) => Promise<any>;
  verifyOTP: (phoneNumber: string, otp: string, id: string) => Promise<any>;
  verifyEmailOTP: (email: string, otp: string, id: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (userData: Partial<UserData>) => void;
  updateUser: (userData: Partial<UserData>) => void;
  handleChannelCreation: (channelId: string) => void;
  initializeAuth: () => Promise<void>;
}

// Auth storage with validation and recovery
const authStorage = {
  getItem: (name: string) => {
    const item = localStorage.getItem(name);
    if (!item) return null;

    try {
      const parsed = JSON.parse(item);
      // Validate auth data
      if (parsed.state?.user) {
        const user = parsed.state.user;
        // Ensure required fields are present
        if (!user.id || !user.accessToken) {
          return null; // Invalid auth data
        }
      }
      return JSON.stringify(parsed);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,

        // Computed properties
        get isPremium() {
          const user = get().user;
          return Boolean(user?.is_premium || user?.premium);
        },

        get hasChannel() {
          return Boolean(get().user?.channelId);
        },

        get userId() {
          return get().user?.id || null;
        },

        get isNewUser() {
          const user = get().user;
          return !user?.name;
        },

        get hasProfile() {
          const user = get().user;
          return !!(user?.name && user?.profile_image);
        },

        // Actions
        setUser: (user) => {
          set({ user }, false, 'auth/setUser');
        },

        setAuthenticated: (authenticated) => {
          set({ isAuthenticated: authenticated }, false, 'auth/setAuthenticated');
        },

        setLoading: (loading) => {
          set({ isLoading: loading }, false, 'auth/setLoading');
        },

        setError: (error) => {
          set({ error }, false, 'auth/setError');
        },

        clearError: () => {
          set({ error: null }, false, 'auth/clearError');
        },

        initializeAuth: async () => {
          try {
            set({ isLoading: true }, false, 'auth/initializeAuth');

            const storedUser = localStorage.getItem("user");
            const token = localStorage.getItem("UserLoggedIn");

            // Fix: If user is not set but token exists, try to recover user from tempUserId or UserId
            if (!storedUser && token) {
              const userIdStr = localStorage.getItem("UserId") || localStorage.getItem("tempUserId");
              if (userIdStr) {
                const userId = Number(userIdStr);
                if (!isNaN(userId)) {
                  // Set a minimal user object to keep session
                  const minimalUser = { id: userId, accessToken: token } as UserData;
                  set({ user: minimalUser, isAuthenticated: true }, false, 'auth/initializeAuth');

                  // Enhancement: Fetch full user profile and update state/localStorage
                  try {
                    const res = await fetch(
                      `${import.meta.env.VITE_API_URL}/api/getuserbyid/${userId}`,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      }
                    );
                    if (res.ok) {
                      const data = await res.json();
                      if (data?.data && Array.isArray(data.data) && data.data[0]) {
                        const userData = { ...data.data[0], accessToken: token };
                        set({ user: userData, isAuthenticated: true }, false, 'auth/initializeAuth');
                        localStorage.setItem("user", JSON.stringify(userData));
                      }
                    }
                  } catch (err) {
                    console.error("Failed to fetch full user profile after refresh", err);
                  }
                  return;
                }
              }
            }

            if (storedUser && token) {
              try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser && parsedUser.accessToken) {
                  set({ user: parsedUser, isAuthenticated: true }, false, 'auth/initializeAuth');
                } else {
                  // If no access token, clear everything
                  localStorage.removeItem("user");
                  localStorage.removeItem("UserLoggedIn");
                  set({ user: null, isAuthenticated: false }, false, 'auth/initializeAuth');
                }
              } catch (err) {
                console.error("Error parsing stored user:", err);
                localStorage.removeItem("user");
                localStorage.removeItem("UserLoggedIn");
                set({ user: null, isAuthenticated: false }, false, 'auth/initializeAuth');
              }
            }
          } finally {
            set({ isLoading: false }, false, 'auth/initializeAuth');
          }
        },

        login: async (phoneNumber: string) => {
          try {
            set({ isLoading: true, error: null }, false, 'auth/login');

            const response = await authAPI.sendOTP(phoneNumber);

            if (response.data.status === 200) {
              // Store temporary user ID for OTP verification
              const tempUserId = response.data.data[0]?.id;
              if (tempUserId) {
                localStorage.setItem('tempUserId', tempUserId.toString());
              }

              set({ isLoading: false }, false, 'auth/login');

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
            set({ isLoading: false, error: error.message }, false, 'auth/login');
            throw error;
          }
        },

        loginWithEmail: async (email: string) => {
          try {
            set({ isLoading: true, error: null }, false, 'auth/loginWithEmail');

            const response = await authAPI.sendEmailOTP(email);
            if (response.data.status === 200) {
              set({ isLoading: false }, false, 'auth/loginWithEmail');

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
            set({ isLoading: false, error: error.message }, false, 'auth/loginWithEmail');
            throw error;
          }
        },

        verifyOTP: async (phoneNumber: string, otp: string, id: string) => {
          try {
            set({ isLoading: true, error: null }, false, 'auth/verifyOTP');

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

            // Update state
            set({ user: userData, isAuthenticated: true, isLoading: false }, false, 'auth/verifyOTP');

            return userData;
          } catch (error) {
            // Clear temporary data on error
            localStorage.removeItem('tempUserId');
            set({ isLoading: false, error: (error as Error).message }, false, 'auth/verifyOTP');
            throw error;
          }
        },

        verifyEmailOTP: async (email: string, otp: string, id: string) => {
          try {
            set({ isLoading: true, error: null }, false, 'auth/verifyEmailOTP');

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
              set({ user: newUser, isAuthenticated: true, isLoading: false }, false, 'auth/verifyEmailOTP');
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
            set({ user: null, isAuthenticated: false, isLoading: false, error: error.message }, false, 'auth/verifyEmailOTP');
            localStorage.removeItem("user");
            localStorage.removeItem("UserLoggedIn");
            throw new Error(error.response?.data?.message || error.message || "Failed to verify OTP");
          }
        },

        logout: async () => {
          try {
            set({ isLoading: true }, false, 'auth/logout');

            const user = get().user;
            if (user?.id) {
              await authAPI.logout(user.id.toString());
            }
          } catch (error) {
            console.error("Logout error:", error);
          } finally {
            set({ user: null, isAuthenticated: false, isLoading: false, error: null }, false, 'auth/logout');
            localStorage.removeItem("user");
            localStorage.removeItem("UserLoggedIn");
          }
        },

        updateUserProfile: (userData: Partial<UserData>) => {
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = { ...currentUser, ...userData };
            set({ user: updatedUser }, false, 'auth/updateUserProfile');
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        },

        updateUser: (userData: Partial<UserData>) => {
          const currentUser = get().user;
          if (currentUser) {
            // Only update if values actually changed
            const currentData = _.pick(currentUser, Object.keys(userData));
            if (!_.isEqual(userData, currentData)) {
              const updatedUser = { ...currentUser, ...userData };
              set({ user: updatedUser }, false, 'auth/updateUser');
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          }
        },

        handleChannelCreation: (channelId: string) => {
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = { ...currentUser, channelId };
            set({ user: updatedUser }, false, 'auth/handleChannelCreation');
          }
        },
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => authStorage),
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for optimized re-renders
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsPremium = () => useAuthStore((state) => state.isPremium);
export const useHasChannel = () => useAuthStore((state) => state.hasChannel);
export const useUserId = () => useAuthStore((state) => state.userId);
export const useIsNewUser = () => useAuthStore((state) => state.isNewUser);
export const useHasProfile = () => useAuthStore((state) => state.hasProfile);

// Actions
export const useAuthActions = () => useAuthStore((state) => ({
  setUser: state.setUser,
  setAuthenticated: state.setAuthenticated,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
  login: state.login,
  loginWithEmail: state.loginWithEmail,
  verifyOTP: state.verifyOTP,
  verifyEmailOTP: state.verifyEmailOTP,
  logout: state.logout,
  updateUserProfile: state.updateUserProfile,
  updateUser: state.updateUser,
  handleChannelCreation: state.handleChannelCreation,
  initializeAuth: state.initializeAuth,
}));