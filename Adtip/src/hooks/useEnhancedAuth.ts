// Enhanced Authentication Hook
// File: src/hooks/useEnhancedAuth.ts

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import EnhancedSessionManager, { SessionData } from '../services/EnhancedSessionManager';
import EnhancedOtpHandler, { OtpState, OtpErrorState } from '../services/EnhancedOtpHandler';
import { Logger } from '../utils/ProductionLogger';
import ApiService from '../services/ApiService';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  error: string | null;
  isInitialized: boolean;
  sessionValid: boolean;
}

export interface OtpAuthState {
  otpSent: boolean;
  otpVerified: boolean;
  otpLoading: boolean;
  otpError: string | null;
  remainingAttempts: number;
  canResend: boolean;
  timeUntilResend: number;
  timeUntilExpiry: number;
  isInCooldown: boolean;
  errorState: OtpErrorState | null;
}

export interface UseEnhancedAuthReturn {
  authState: AuthState;
  otpState: OtpAuthState;
  
  // Authentication methods
  sendOtp: (mobileNumber: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Recovery methods
  retryLastOperation: () => Promise<void>;
  resetOtpSession: () => Promise<void>;
  handleNetworkRecovery: () => Promise<void>;
  
  // Utility methods
  clearError: () => void;
  updateActivity: () => void;
  checkSessionValidity: () => Promise<boolean>;
}

export const useEnhancedAuth = (): UseEnhancedAuthReturn => {
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null,
    isInitialized: false,
    sessionValid: false
  });

  // OTP state
  const [otpState, setOtpState] = useState<OtpAuthState>({
    otpSent: false,
    otpVerified: false,
    otpLoading: false,
    otpError: null,
    remainingAttempts: 3,
    canResend: false,
    timeUntilResend: 0,
    timeUntilExpiry: 0,
    isInCooldown: false,
    errorState: null
  });

  // Service instances
  const sessionManager = EnhancedSessionManager.getInstance();
  const otpHandler = EnhancedOtpHandler.getInstance();

  // Last operation tracking for retry functionality
  const [lastOperation, setLastOperation] = useState<{
    type: 'SEND_OTP' | 'VERIFY_OTP' | 'REFRESH_SESSION';
    params?: any;
  } | null>(null);

  // Initialize authentication system
  useEffect(() => {
    initializeAuth();
  }, []);

  // Update OTP state periodically
  useEffect(() => {
    const interval = setInterval(updateOtpState, 1000);
    return () => clearInterval(interval);
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Initialize services
      await sessionManager.initialize();
      
      // Check existing session
      const currentSession = sessionManager.getCurrentSession();
      if (currentSession && sessionManager.isSessionValid()) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          sessionValid: true,
          user: { id: currentSession.userId } // Minimal user object
        }));
        
        Logger.info('useEnhancedAuth', 'Existing session found and valid');
      } else {
        Logger.info('useEnhancedAuth', 'No valid session found');
      }
    } catch (error) {
      Logger.error('useEnhancedAuth', 'Authentication initialization failed:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to initialize authentication'
      }));
    } finally {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: true
      }));
    }
  }, []);

  // Update OTP state from handler
  const updateOtpState = useCallback(() => {
    const currentOtpState = otpHandler.getCurrentState();
    if (currentOtpState) {
      setOtpState({
        otpSent: currentOtpState.otpSent,
        otpVerified: currentOtpState.otpVerified,
        otpLoading: false,
        otpError: currentOtpState.errorState?.message || null,
        remainingAttempts: otpHandler.getRemainingAttempts(),
        canResend: otpHandler.canResend(),
        timeUntilResend: Math.ceil(otpHandler.getTimeUntilResendAllowed() / 1000),
        timeUntilExpiry: Math.ceil(otpHandler.getTimeUntilExpiry() / 1000),
        isInCooldown: otpHandler.isInCooldown(),
        errorState: currentOtpState.errorState || null
      });
    }
  }, []);

  // Send OTP
  const sendOtp = useCallback(async (mobileNumber: string) => {
    try {
      setOtpState(prev => ({ ...prev, otpLoading: true, otpError: null }));
      setLastOperation({ type: 'SEND_OTP', params: { mobileNumber } });
      
      // Initialize OTP session
      await otpHandler.initializeOtpSession(mobileNumber);
      
      // Send OTP
      const result = await otpHandler.sendOtp();
      
      if (result.success) {
        updateOtpState();
        Logger.info('useEnhancedAuth', 'OTP sent successfully');
      } else {
        setOtpState(prev => ({
          ...prev,
          otpError: result.message
        }));
        
        if (result.retryAfter) {
          // Show retry information
          Alert.alert(
            'Please Wait',
            `${result.message}\nYou can try again in ${result.retryAfter} seconds.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error: any) {
      Logger.error('useEnhancedAuth', 'Send OTP failed:', error);
      setOtpState(prev => ({
        ...prev,
        otpError: error.message || 'Failed to send OTP'
      }));
      
      // Show user-friendly error
      Alert.alert(
        'Error',
        error.message || 'Failed to send OTP. Please check your network connection and try again.',
        [
          { text: 'Retry', onPress: () => sendOtp(mobileNumber) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setOtpState(prev => ({ ...prev, otpLoading: false }));
    }
  }, []);

  // Verify OTP
  const verifyOtp = useCallback(async (otp: string) => {
    try {
      setOtpState(prev => ({ ...prev, otpLoading: true, otpError: null }));
      setLastOperation({ type: 'VERIFY_OTP', params: { otp } });
      
      const result = await otpHandler.verifyOtp(otp);
      
      if (result.success) {
        // Create session with user data
        const sessionData: Omit<SessionData, 'loginTime' | 'lastActivity' | 'deviceId'> = {
          accessToken: result.data?.accessToken || `temp_${Date.now()}`,
          userId: result.data?.id?.toString() || 'unknown',
          isOtpVerified: true
        };
        
        await sessionManager.createSession(sessionData);
        
        // Track successful login attempt
        await sessionManager.trackLoginAttempt(true);
        await otpHandler.clearState();
        
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          sessionValid: true,
          user: result.data,
          error: null
        }));
        
        setOtpState(prev => ({
          ...prev,
          otpVerified: true,
          otpError: null
        }));
        
        Logger.info('useEnhancedAuth', 'OTP verification successful');
      } else {
        setOtpState(prev => ({
          ...prev,
          otpError: result.message
        }));
        
        // Track failed attempt
        await sessionManager.trackOtpAttempt(false);
        updateOtpState();
        
        Logger.warn('useEnhancedAuth', 'OTP verification failed:', result.message);
      }
    } catch (error: any) {
      Logger.error('useEnhancedAuth', 'OTP verification error:', error);
      
      // Track failed attempt
      await sessionManager.trackOtpAttempt(false);
      
      setOtpState(prev => ({
        ...prev,
        otpError: error.message || 'OTP verification failed'
      }));
      
      // Show contextual error message
      if (error.message?.includes('network') || error.message?.includes('connection')) {
        Alert.alert(
          'Network Error',
          'Please check your internet connection and try again.',
          [
            { text: 'Retry', onPress: () => verifyOtp(otp) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } finally {
      setOtpState(prev => ({ ...prev, otpLoading: false }));
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Call logout API if user exists
      if (authState.user?.id) {
        try {
          await ApiService.logout(authState.user.id.toString());
        } catch (error) {
          Logger.warn('useEnhancedAuth', 'Logout API call failed:', error);
          // Continue with local logout even if API fails
        }
      }
      
      // Clear session and OTP state
      await sessionManager.clearSession();
      await otpHandler.clearState();
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        isInitialized: true,
        sessionValid: false
      });
      
      setOtpState({
        otpSent: false,
        otpVerified: false,
        otpLoading: false,
        otpError: null,
        remainingAttempts: 3,
        canResend: false,
        timeUntilResend: 0,
        timeUntilExpiry: 0,
        isInCooldown: false,
        errorState: null
      });
      
      Logger.info('useEnhancedAuth', 'Logout completed');
    } catch (error) {
      Logger.error('useEnhancedAuth', 'Logout error:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to logout properly'
      }));
    }
  }, [authState.user?.id]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      setLastOperation({ type: 'REFRESH_SESSION' });
      
      const isValid = await sessionManager.validateSession();
      
      if (isValid) {
        const currentSession = sessionManager.getCurrentSession();
        if (currentSession) {
          setAuthState(prev => ({
            ...prev,
            sessionValid: true,
            error: null
          }));
          Logger.info('useEnhancedAuth', 'Session refreshed successfully');
        }
      } else {
        // Session invalid, need re-authentication
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          sessionValid: false,
          user: null
        }));
        Logger.warn('useEnhancedAuth', 'Session refresh failed - re-authentication required');
      }
    } catch (error) {
      Logger.error('useEnhancedAuth', 'Session refresh error:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to refresh session'
      }));
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Retry last operation
  const retryLastOperation = useCallback(async () => {
    if (!lastOperation) return;
    
    try {
      switch (lastOperation.type) {
        case 'SEND_OTP':
          await sendOtp(lastOperation.params.mobileNumber);
          break;
        case 'VERIFY_OTP':
          await verifyOtp(lastOperation.params.otp);
          break;
        case 'REFRESH_SESSION':
          await refreshSession();
          break;
      }
    } catch (error) {
      Logger.error('useEnhancedAuth', 'Retry operation failed:', error);
    }
  }, [lastOperation, sendOtp, verifyOtp, refreshSession]);

  // Reset OTP session
  const resetOtpSession = useCallback(async () => {
    try {
      await otpHandler.resetSession();
      setOtpState({
        otpSent: false,
        otpVerified: false,
        otpLoading: false,
        otpError: null,
        remainingAttempts: 3,
        canResend: false,
        timeUntilResend: 0,
        timeUntilExpiry: 0,
        isInCooldown: false,
        errorState: null
      });
      Logger.info('useEnhancedAuth', 'OTP session reset');
    } catch (error) {
      Logger.error('useEnhancedAuth', 'Failed to reset OTP session:', error);
    }
  }, []);

  // Handle network recovery
  const handleNetworkRecovery = useCallback(async () => {
    try {
      // Attempt to recover from network errors
      await otpHandler.recoverFromNetworkError();
      await sessionManager.handleNetworkError();
      
      // Retry last operation if applicable
      if (lastOperation) {
        await retryLastOperation();
      }
      
      Logger.info('useEnhancedAuth', 'Network recovery attempted');
    } catch (error) {
      Logger.error('useEnhancedAuth', 'Network recovery failed:', error);
    }
  }, [lastOperation, retryLastOperation]);

  // Clear error
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
    setOtpState(prev => ({ ...prev, otpError: null, errorState: null }));
  }, []);

  // Update activity
  const updateActivity = useCallback(async () => {
    try {
      await sessionManager.updateActivity();
    } catch (error) {
      Logger.error('useEnhancedAuth', 'Failed to update activity:', error);
    }
  }, []);

  // Check session validity
  const checkSessionValidity = useCallback(async (): Promise<boolean> => {
    try {
      const isValid = await sessionManager.validateSession();
      setAuthState(prev => ({ ...prev, sessionValid: isValid }));
      return isValid;
    } catch (error) {
      Logger.error('useEnhancedAuth', 'Session validity check failed:', error);
      return false;
    }
  }, []);

  return {
    authState,
    otpState,
    sendOtp,
    verifyOtp,
    logout,
    refreshSession,
    retryLastOperation,
    resetOtpSession,
    handleNetworkRecovery,
    clearError,
    updateActivity,
    checkSessionValidity
  };
};