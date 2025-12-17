import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useEnhancedAuth as useAuthStore, 
  useAuthActions, 
  useAuthUser as useStoreAuthUser, 
  useIsAuthenticated, 
  useAuthLoading, 
  useAuthError as useStoreAuthError,
  useOTPSession,
  useCanResendOTP,
  useResendCooldown
} from '../stores/enhanced-auth.store';
import { setAuthRedirectCallback } from '../services/enhanced-api';
import { useAuthModal } from '../contexts/AuthModalContext';

// Main authentication hook
export const useEnhancedAuth = () => {
  const navigate = useNavigate();
  const { openLoginModal } = useAuthModal();
  
  // Get state from store
  const user = useStoreAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const error = useStoreAuthError();
  const otpSession = useOTPSession();
  const canResendOTP = useCanResendOTP();
  const resendCooldownSeconds = useResendCooldown();
  
  // Get actions from store
  const actions = useAuthActions();
  const { isOTPLoading, isResendLoading, isPremium, hasChannel, userId, isNewUser, hasProfile } = useAuthStore();

  // Set up auth redirect callback for API interceptor
  useEffect(() => {
    setAuthRedirectCallback(() => {
      openLoginModal();
    });
  }, [openLoginModal]);

  // Require authentication function
  const requireAuth = useCallback((callback?: () => void): boolean => {
    if (isAuthenticated && user) {
      callback?.();
      return true;
    }

    openLoginModal();
    return false;
  }, [isAuthenticated, user, openLoginModal]);

  // Check if user needs to complete profile
  const needsProfileCompletion = useCallback((): boolean => {
    return isAuthenticated && (!user?.name || !user?.profile_image);
  }, [isAuthenticated, user]);

  // Navigate to appropriate page based on auth state
  const navigateBasedOnAuth = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (needsProfileCompletion()) {
      navigate('/complete-profile');
      return;
    }

    navigate('/home');
  }, [isAuthenticated, needsProfileCompletion, navigate]);

  // Enhanced login function with navigation
  const loginAndNavigate = useCallback(async (phoneNumber: string) => {
    const result = await actions.login(phoneNumber);
    if (result.success) {
      // Navigation will be handled by OTP verification
      return result;
    }
    return result;
  }, [actions]);

  // Enhanced email login function with navigation
  const loginWithEmailAndNavigate = useCallback(async (email: string) => {
    const result = await actions.loginWithEmail(email);
    if (result.success) {
      // Navigation will be handled by OTP verification
      return result;
    }
    return result;
  }, [actions]);

  // Enhanced OTP verification with navigation
  const verifyOTPAndNavigate = useCallback(async (otp: string) => {
    const result = await actions.verifyOTP(otp);
    if (result.success) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        navigateBasedOnAuth();
      }, 500);
    }
    return result;
  }, [actions, navigateBasedOnAuth]);

  // Enhanced logout with navigation
  const logoutAndNavigate = useCallback(async () => {
    await actions.logout();
    navigate('/login');
  }, [actions, navigate]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    isOTPLoading,
    isResendLoading,
    error,
    otpSession,
    canResendOTP,
    resendCooldownSeconds,
    
    // Computed state
    isPremium,
    hasChannel,
    userId,
    isNewUser,
    hasProfile,
    needsProfileCompletion: needsProfileCompletion(),
    
    // Actions
    login: loginAndNavigate,
    loginWithEmail: loginWithEmailAndNavigate,
    verifyOTP: verifyOTPAndNavigate,
    resendOTP: actions.resendOTP,
    logout: logoutAndNavigate,
    updateUser: actions.updateUser,
    clearError: actions.clearError,
    clearOTPSession: actions.clearOTPSession,
    
    // Utilities
    requireAuth,
    navigateBasedOnAuth,
    
    // Raw actions (for advanced use)
    rawActions: actions,
  };
};

// Simplified hooks for specific use cases
export const useAuthUser = () => {
  return useStoreAuthUser();
};

export const useAuthStatus = () => {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const user = useAuthUser();
  
  return {
    isAuthenticated,
    isLoading,
    isLoggedIn: isAuthenticated && !!user,
    isGuest: !isAuthenticated,
  };
};

export const useAuthError = () => {
  const error = useStoreAuthError();
  const { clearError } = useAuthActions();
  
  return {
    error,
    hasError: !!error,
    clearError,
  };
};

export const useOTPState = () => {
  const otpSession = useOTPSession();
  const canResendOTP = useCanResendOTP();
  const resendCooldownSeconds = useResendCooldown();
  const { isOTPLoading, isResendLoading } = useAuthStore();
  
  return {
    otpSession,
    hasActiveSession: !!otpSession,
    canResendOTP,
    resendCooldownSeconds,
    isVerifying: isOTPLoading,
    isResending: isResendLoading,
    sessionType: otpSession?.type,
    sessionContact: otpSession?.type === 'phone' ? otpSession.phoneNumber : otpSession?.email,
  };
};

// Hook for protecting routes
export const useProtectedRoute = () => {
  const { isAuthenticated, isLoading, navigateBasedOnAuth } = useEnhancedAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigateBasedOnAuth();
    }
  }, [isAuthenticated, isLoading, navigateBasedOnAuth]);
  
  return {
    isAuthenticated,
    isLoading,
    shouldRender: isAuthenticated,
  };
};

// Hook for user profile management
export const useUserProfile = () => {
  const user = useStoreAuthUser();
  const { updateUser } = useAuthActions();
  const { isPremium, hasChannel, isNewUser, hasProfile } = useAuthStore();
  
  const updateProfile = useCallback((updates: Partial<typeof user>) => {
    if (user) {
      updateUser(updates);
    }
  }, [user, updateUser]);
  
  return {
    user,
    isPremium,
    hasChannel,
    isNewUser,
    hasProfile,
    updateProfile,
  };
};