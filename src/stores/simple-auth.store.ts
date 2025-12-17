// Simplified Authentication Store - Fixed infinite loop issues
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { authAPI } from '../services/api';
import { toast } from 'sonner';

// User data interface
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

// OTP session state
interface OTPSession {
  phoneNumber: string;
  email: string;
  tempUserId: string;
  type: 'phone' | 'email';
  expiresAt: number;
  resendCooldownUntil: number;
  attemptCount: number;
  maxAttempts: number;
}

// Authentication state interface
interface AuthState {
  // Core state
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Error state
  error: string | null;
  
  // OTP state
  otpSession: OTPSession | null;
  isOTPLoading: boolean;
  isResendLoading: boolean;
  
  // Actions
  initializeAuth: () => Promise<void>;
  login: (phoneNumber: string) => Promise<{ success: boolean; message: string }>;
  loginWithEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (otp: string) => Promise<{ success: boolean; message: string }>;
  resendOTP: () => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  clearOTPSession: () => void;
  updateUser: (userData: Partial<UserData>) => void;
  setUser: (user: UserData | null) => void;
  
  // Computed getters (safe versions)
  getIsPremium: () => boolean;
  getHasChannel: () => boolean;
  getUserId: () => number | null;
  getIsNewUser: () => boolean;
  getHasProfile: () => boolean;
  getCanResendOTP: () => boolean;
  getResendCooldownSeconds: () => number;
}

// Enhanced error messages mapping
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  OTP_EXPIRED: 'OTP has expired. Please request a new one.',
  OTP_INVALID: 'Invalid OTP. Please check and try again.',
  OTP_NOT_FOUND: 'OTP not found or expired. Please request a new one.',
  PHONE_INVALID: 'Please enter a valid 10-digit phone number.',
  EMAIL_INVALID: 'Please enter a valid email address.',
  TOO_MANY_ATTEMPTS: 'Too many failed attempts. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

// Utility functions
const getErrorMessage = (error: any): string => {
  if (!error) return ERROR_MESSAGES.UNKNOWN_ERROR;
  
  if (!error.response) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  const status = error.response?.status;
  const message = error.response?.data?.message || error.message || '';
  
  if (message.toLowerCase().includes('otp') && message.toLowerCase().includes('expired')) {
    return ERROR_MESSAGES.OTP_EXPIRED;
  }
  if (message.toLowerCase().includes('otp') && message.toLowerCase().includes('not found')) {
    return ERROR_MESSAGES.OTP_NOT_FOUND;
  }
  if (message.toLowerCase().includes('invalid otp')) {
    return ERROR_MESSAGES.OTP_INVALID;
  }
  
  switch (status) {
    case 400:
      return message || 'Invalid request. Please check your input.';
    case 401:
      return ERROR_MESSAGES.SESSION_EXPIRED;
    case 404:
      return ERROR_MESSAGES.OTP_NOT_FOUND;
    case 429:
      return ERROR_MESSAGES.TOO_MANY_ATTEMPTS;
    case 500:
    case 502:
    case 503:
      return ERROR_MESSAGES.SERVER_ERROR;
    default:
      return message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }
};

const validatePhoneNumber = (phone: string): boolean => {
  return /^\d{10}$/.test(phone);
};

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

// Create the simplified auth store
export const useSimpleAuth = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: false,
        error: null,
        otpSession: null,
        isOTPLoading: false,
        isResendLoading: false,

        // Safe computed getters
        getIsPremium: () => {
          const state = get();
          return Boolean(state.user?.is_premium || state.user?.premium);
        },

        getHasChannel: () => {
          const state = get();
          return Boolean(state.user?.channelId);
        },

        getUserId: () => {
          const state = get();
          return state.user?.id || null;
        },

        getIsNewUser: () => {
          const state = get();
          return !state.user?.name || !state.user?.profile_image;
        },

        getHasProfile: () => {
          const state = get();
          return !!(state.user?.name && state.user?.profile_image);
        },

        getCanResendOTP: () => {
          const state = get();
          const session = state.otpSession;
          if (!session || state.isResendLoading) return false;
          return Date.now() > session.resendCooldownUntil;
        },

        getResendCooldownSeconds: () => {
          const state = get();
          const session = state.otpSession;
          if (!session) return 0;
          return Math.max(0, Math.ceil((session.resendCooldownUntil - Date.now()) / 1000));
        },

        // Initialize authentication
        initializeAuth: async () => {
          if (get().isInitialized) return;
          
          set({ isLoading: true }, false, 'auth/initializeAuth/start');

          try {
            const storedUser = localStorage.getItem("user");
            const token = localStorage.getItem("UserLoggedIn");
            const userId = localStorage.getItem("UserId");

            if (!token) {
              localStorage.removeItem("user");
              localStorage.removeItem("UserId");
              set({ 
                user: null, 
                isAuthenticated: false, 
                isLoading: false, 
                isInitialized: true 
              }, false, 'auth/initializeAuth/no-token');
              return;
            }

            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser?.id && parsedUser?.accessToken === token) {
                  set({ 
                    user: parsedUser, 
                    isAuthenticated: true,
                    isLoading: false,
                    isInitialized: true
                  }, false, 'auth/initializeAuth/restored');
                  return;
                }
              } catch (error) {
                console.error('Failed to parse stored user:', error);
              }
            }

            if (userId && token) {
              try {
                const response = await fetch(
                  `${import.meta.env.VITE_API_URL}/api/getuserbyid/${userId}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                if (response.ok) {
                  const data = await response.json();
                  if (data?.data && Array.isArray(data.data) && data.data[0]) {
                    const userData = { ...data.data[0], accessToken: token };
                    localStorage.setItem("user", JSON.stringify(userData));
                    set({ 
                      user: userData, 
                      isAuthenticated: true,
                      isLoading: false,
                      isInitialized: true
                    }, false, 'auth/initializeAuth/recovered');
                    return;
                  }
                }
              } catch (error) {
                console.error('Failed to recover user:', error);
              }
            }

            localStorage.removeItem("user");
            localStorage.removeItem("UserLoggedIn");
            localStorage.removeItem("UserId");
            
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false, 
              isInitialized: true 
            }, false, 'auth/initializeAuth/cleared');

          } catch (error) {
            console.error('Auth initialization error:', error);
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false, 
              isInitialized: true,
              error: getErrorMessage(error)
            }, false, 'auth/initializeAuth/error');
          }
        },

        // Login with phone number
        login: async (phoneNumber: string) => {
          if (!validatePhoneNumber(phoneNumber)) {
            const error = ERROR_MESSAGES.PHONE_INVALID;
            set({ error }, false, 'auth/login/invalid-phone');
            return { success: false, message: error };
          }

          if (get().isLoading) {
            return { success: false, message: 'Login already in progress' };
          }

          set({ isLoading: true, error: null }, false, 'auth/login/start');

          try {
            const response = await authAPI.sendOTP(phoneNumber);

            if (response.data.status === 200) {
              const userData = response.data.data[0];
              const tempUserId = userData?.id?.toString();

              if (!tempUserId) {
                throw new Error('Invalid response from server');
              }

              const otpSession: OTPSession = {
                phoneNumber,
                email: '',
                tempUserId,
                type: 'phone',
                expiresAt: Date.now() + (10 * 60 * 1000),
                resendCooldownUntil: Date.now() + (30 * 1000),
                attemptCount: 0,
                maxAttempts: 5,
              };

              set({ 
                isLoading: false, 
                otpSession,
                error: null
              }, false, 'auth/login/success');

              return { success: true, message: 'OTP sent successfully' };
            } else {
              throw new Error(response.data.message || 'Failed to send OTP');
            }
          } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            set({ 
              isLoading: false, 
              error: errorMessage
            }, false, 'auth/login/error');
            return { success: false, message: errorMessage };
          }
        },

        // Login with email
        loginWithEmail: async (email: string) => {
          if (!validateEmail(email)) {
            const error = ERROR_MESSAGES.EMAIL_INVALID;
            set({ error }, false, 'auth/loginWithEmail/invalid-email');
            return { success: false, message: error };
          }

          if (get().isLoading) {
            return { success: false, message: 'Login already in progress' };
          }

          set({ isLoading: true, error: null }, false, 'auth/loginWithEmail/start');

          try {
            const response = await authAPI.sendEmailOTP(email);

            if (response.data.status === 200) {
              const userData = response.data.data[0];
              const tempUserId = userData?.id?.toString();

              if (!tempUserId) {
                throw new Error('Invalid response from server');
              }

              const otpSession: OTPSession = {
                phoneNumber: '',
                email,
                tempUserId,
                type: 'email',
                expiresAt: Date.now() + (10 * 60 * 1000),
                resendCooldownUntil: Date.now() + (30 * 1000),
                attemptCount: 0,
                maxAttempts: 5,
              };

              set({ 
                isLoading: false, 
                otpSession,
                error: null
              }, false, 'auth/loginWithEmail/success');

              return { success: true, message: 'OTP sent successfully' };
            } else {
              throw new Error(response.data.message || 'Failed to send OTP');
            }
          } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            set({ 
              isLoading: false, 
              error: errorMessage
            }, false, 'auth/loginWithEmail/error');
            return { success: false, message: errorMessage };
          }
        },

        // Verify OTP
        verifyOTP: async (otp: string) => {
          const session = get().otpSession;
          
          if (!session) {
            const error = 'No active OTP session. Please request a new OTP.';
            set({ error }, false, 'auth/verifyOTP/no-session');
            return { success: false, message: error };
          }

          if (!validateOTP(otp)) {
            const error = 'Please enter a valid 6-digit OTP';
            set({ error }, false, 'auth/verifyOTP/invalid-otp');
            return { success: false, message: error };
          }

          if (Date.now() > session.expiresAt) {
            const error = ERROR_MESSAGES.OTP_EXPIRED;
            set({ error, otpSession: null }, false, 'auth/verifyOTP/expired');
            return { success: false, message: error };
          }

          if (session.attemptCount >= session.maxAttempts) {
            const error = ERROR_MESSAGES.TOO_MANY_ATTEMPTS;
            set({ error, otpSession: null }, false, 'auth/verifyOTP/max-attempts');
            return { success: false, message: error };
          }

          if (get().isOTPLoading) {
            return { success: false, message: 'Verification already in progress' };
          }

          set({ 
            isOTPLoading: true, 
            error: null,
            otpSession: { ...session, attemptCount: session.attemptCount + 1 }
          }, false, 'auth/verifyOTP/start');

          try {
            let response;
            
            if (session.type === 'phone') {
              response = await authAPI.verifyOTP(session.phoneNumber, otp, session.tempUserId);
            } else {
              response = await authAPI.verifyEmailOTP(session.email, otp, session.tempUserId);
            }

            if (response.data.status === 200) {
              const { accessToken, data } = response.data;
              const userData = {
                ...data[0],
                accessToken,
                channelId: data[0]?.channelId || null
              };

              localStorage.setItem('UserLoggedIn', accessToken);
              localStorage.setItem('user', JSON.stringify(userData));
              localStorage.setItem('UserId', userData.id.toString());

              set({ 
                user: userData,
                isAuthenticated: true,
                isOTPLoading: false,
                otpSession: null,
                error: null
              }, false, 'auth/verifyOTP/success');

              return { success: true, message: 'OTP verified successfully' };
            } else {
              throw new Error(response.data.message || 'OTP verification failed');
            }
          } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            set({ 
              isOTPLoading: false, 
              error: errorMessage
            }, false, 'auth/verifyOTP/error');
            return { success: false, message: errorMessage };
          }
        },

        // Resend OTP
        resendOTP: async () => {
          const session = get().otpSession;
          
          if (!session) {
            const error = 'No active OTP session';
            set({ error }, false, 'auth/resendOTP/no-session');
            return { success: false, message: error };
          }

          if (!get().getCanResendOTP()) {
            const remaining = get().getResendCooldownSeconds();
            const error = `Please wait ${remaining} seconds before requesting another OTP`;
            set({ error }, false, 'auth/resendOTP/cooldown');
            return { success: false, message: error };
          }

          if (get().isResendLoading) {
            return { success: false, message: 'Resend already in progress' };
          }

          set({ isResendLoading: true, error: null }, false, 'auth/resendOTP/start');

          try {
            let response;
            
            if (session.type === 'phone') {
              response = await authAPI.sendOTP(session.phoneNumber);
            } else {
              response = await authAPI.sendEmailOTP(session.email);
            }

            if (response.data.status === 200) {
              const updatedSession: OTPSession = {
                ...session,
                expiresAt: Date.now() + (10 * 60 * 1000),
                resendCooldownUntil: Date.now() + (30 * 1000),
                attemptCount: 0,
              };

              set({ 
                isResendLoading: false,
                otpSession: updatedSession,
                error: null
              }, false, 'auth/resendOTP/success');

              return { success: true, message: 'OTP resent successfully' };
            } else {
              throw new Error(response.data.message || 'Failed to resend OTP');
            }
          } catch (error: any) {
            const errorMessage = getErrorMessage(error);
            set({ 
              isResendLoading: false, 
              error: errorMessage
            }, false, 'auth/resendOTP/error');
            return { success: false, message: errorMessage };
          }
        },

        // Logout
        logout: async () => {
          set({ isLoading: true }, false, 'auth/logout/start');

          try {
            const user = get().user;
            if (user?.id) {
              await authAPI.logout(user.id.toString());
            }
          } catch (error) {
            console.error("Logout error:", error);
          } finally {
            localStorage.removeItem("user");
            localStorage.removeItem("UserLoggedIn");
            localStorage.removeItem("UserId");
            localStorage.removeItem("tempUserId");

            set({ 
              user: null,
              isAuthenticated: false,
              isLoading: false,
              otpSession: null,
              error: null
            }, false, 'auth/logout/complete');
          }
        },

        // Utility actions
        clearError: () => {
          set({ error: null }, false, 'auth/clearError');
        },

        clearOTPSession: () => {
          set({ otpSession: null, error: null }, false, 'auth/clearOTPSession');
        },

        updateUser: (userData: Partial<UserData>) => {
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = { ...currentUser, ...userData };
            set({ user: updatedUser }, false, 'auth/updateUser');
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        },

        setUser: (user: UserData | null) => {
          set({ 
            user, 
            isAuthenticated: !!user 
          }, false, 'auth/setUser');
          
          if (user) {
            localStorage.setItem("user", JSON.stringify(user));
          } else {
            localStorage.removeItem("user");
            localStorage.removeItem("UserLoggedIn");
            localStorage.removeItem("UserId");
          }
        },
      }),
      {
        name: 'simple-auth-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'simple-auth-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for optimized re-renders
export const useAuthUser = () => useSimpleAuth((state) => state.user);
export const useIsAuthenticated = () => useSimpleAuth((state) => state.isAuthenticated);
export const useAuthLoading = () => useSimpleAuth((state) => state.isLoading);
export const useAuthError = () => useSimpleAuth((state) => state.error);
export const useOTPSession = () => useSimpleAuth((state) => state.otpSession);

// Action hooks
export const useAuthActions = () => useSimpleAuth((state) => ({
  initializeAuth: state.initializeAuth,
  login: state.login,
  loginWithEmail: state.loginWithEmail,
  verifyOTP: state.verifyOTP,
  resendOTP: state.resendOTP,
  logout: state.logout,
  clearError: state.clearError,
  clearOTPSession: state.clearOTPSession,
  updateUser: state.updateUser,
  setUser: state.setUser,
  getIsPremium: state.getIsPremium,
  getHasChannel: state.getHasChannel,
  getUserId: state.getUserId,
  getIsNewUser: state.getIsNewUser,
  getHasProfile: state.getHasProfile,
  getCanResendOTP: state.getCanResendOTP,
  getResendCooldownSeconds: state.getResendCooldownSeconds,
}));