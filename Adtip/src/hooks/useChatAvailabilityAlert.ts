/**
 * useChatAvailabilityAlert - Hook to handle chat unavailability detection and alerts
 * 
 * Detects FCM token errors and shows beautiful alert when recipient is not available
 */

import { useState, useCallback } from 'react';

export interface ChatAvailabilityState {
  showAlert: boolean;
  recipientName: string;
  errorType: 'fcm_token_invalid' | 'user_not_found' | 'network_error' | null;
}

export interface ChatAvailabilityActions {
  showUnavailableAlert: (recipientName: string, errorType?: string) => void;
  hideAlert: () => void;
  retryChat: () => void;
}

export interface UseChatAvailabilityAlertReturn {
  state: ChatAvailabilityState;
  actions: ChatAvailabilityActions;
}

/**
 * Hook to manage chat availability alerts
 */
export function useChatAvailabilityAlert(
  onRetry?: () => void
): UseChatAvailabilityAlertReturn {
  const [state, setState] = useState<ChatAvailabilityState>({
    showAlert: false,
    recipientName: '',
    errorType: null,
  });

  const showUnavailableAlert = useCallback((
    recipientName: string,
    errorType: string = 'fcm_token_invalid'
  ) => {
    console.log('[ChatAvailabilityAlert] 🚨 Showing unavailable alert for:', recipientName, 'Error:', errorType);

    const newState = {
      showAlert: true,
      recipientName,
      errorType: errorType as any,
    };

    console.log('[ChatAvailabilityAlert] 🚨 Setting new state:', newState);
    setState(newState);
  }, []);

  const hideAlert = useCallback(() => {
    console.log('[ChatAvailabilityAlert] Hiding alert');
    setState(prev => ({
      ...prev,
      showAlert: false,
    }));
  }, []);

  const retryChat = useCallback(() => {
    console.log('[ChatAvailabilityAlert] Retrying chat');
    hideAlert();
    onRetry?.();
  }, [hideAlert, onRetry]);

  return {
    state,
    actions: {
      showUnavailableAlert,
      hideAlert,
      retryChat,
    },
  };
}

/**
 * Utility function to detect if an error indicates chat unavailability
 */
export function isChatUnavailableError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString() || '';
  const errorLower = errorMessage.toLowerCase();
  
  // Check for FCM token related errors
  const fcmTokenErrors = [
    'invalid or unregistered fcm token',
    'fcm token not found',
    'invalid fcm token',
    'unregistered fcm token',
    'token not found',
    'invalid token',
    'registration token not found',
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
  ];
  
  // Check for user not found errors
  const userNotFoundErrors = [
    'user not found',
    'recipient not found',
    'user does not exist',
    'no user found',
  ];
  
  // Check for network/server errors that might indicate unavailability
  const networkErrors = [
    'network error',
    'connection failed',
    'timeout',
    'server error',
    'service unavailable',
  ];
  
  const isFCMError = fcmTokenErrors.some(pattern => errorLower.includes(pattern));
  const isUserError = userNotFoundErrors.some(pattern => errorLower.includes(pattern));
  const isNetworkError = networkErrors.some(pattern => errorLower.includes(pattern));
  
  return isFCMError || isUserError || isNetworkError;
}

/**
 * Utility function to get error type from error message
 */
export function getChatErrorType(error: any): 'fcm_token_invalid' | 'user_not_found' | 'network_error' {
  if (!error) return 'fcm_token_invalid';
  
  const errorMessage = error.message || error.toString() || '';
  const errorLower = errorMessage.toLowerCase();
  
  // Check for user not found errors first
  const userNotFoundErrors = [
    'user not found',
    'recipient not found',
    'user does not exist',
    'no user found',
  ];
  
  if (userNotFoundErrors.some(pattern => errorLower.includes(pattern))) {
    return 'user_not_found';
  }
  
  // Check for network errors
  const networkErrors = [
    'network error',
    'connection failed',
    'timeout',
    'server error',
    'service unavailable',
  ];
  
  if (networkErrors.some(pattern => errorLower.includes(pattern))) {
    return 'network_error';
  }
  
  // Default to FCM token error
  return 'fcm_token_invalid';
}

export default useChatAvailabilityAlert;
