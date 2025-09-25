/**
 * React Hook for Error Handling
 * Provides easy-to-use error handling for React components
 */

import React, { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import ErrorHandlingService from '../services/ErrorHandlingService';
import { useNavigation, useRoute } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';

export interface UseErrorHandlerOptions {
  showUserFeedback?: boolean;
  logErrors?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface ErrorState {
  hasError: boolean;
  error: any;
  isRetrying: boolean;
  retryCount: number;
  errorMessage: string;
}

export interface ErrorHandler {
  // Error state
  errorState: ErrorState;
  
  // Error handling functions
  handleError: (error: any, context?: string) => Promise<void>;
  handleNetworkError: (error: any, retryFn?: () => Promise<any>) => Promise<void>;
  handleApiError: (error: any, context?: string) => Promise<void>;
  handleValidationError: (errors: { field: string; message: string }[]) => Promise<void>;
  handlePaymentError: (error: any, amount?: number) => Promise<void>;
  
  // Retry functionality
  retry: (operation: () => Promise<any>) => Promise<any>;
  
  // Recovery functions
  clearError: () => void;
  showErrorDetails: () => void;
  
  // Utility functions
  withErrorHandling: <T>(operation: () => Promise<T>) => Promise<T | null>;
  
  // Network helpers
  checkNetworkAndExecute: (operation: () => Promise<any>) => Promise<any>;
}

const DEFAULT_OPTIONS: UseErrorHandlerOptions = {
  showUserFeedback: true,
  logErrors: true,
  retryAttempts: 3,
  retryDelay: 1000,
};

export const useErrorHandler = (options?: UseErrorHandlerOptions): ErrorHandler => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const navigation = useNavigation();
  const route = useRoute();
  
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    isRetrying: false,
    retryCount: 0,
    errorMessage: '',
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getCurrentContext = useCallback(() => ({
    screen: route.name,
    action: 'component_operation',
  }), [route.name]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      isRetrying: false,
      retryCount: 0,
      errorMessage: '',
    });
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const handleError = useCallback(async (error: any, context?: string) => {
    const errorMessage = error?.message || error?.response?.data?.message || 'An error occurred';
    
    setErrorState(prev => ({
      ...prev,
      hasError: true,
      error,
      errorMessage,
    }));

    if (config.logErrors) {
      await ErrorHandlingService.logError(error, {
        ...getCurrentContext(),
        action: context || 'unknown_operation',
      });
    }

    if (config.showUserFeedback) {
      // Let ErrorHandlingService handle the user feedback
      // We don't duplicate alerts here to avoid multiple dialogs
    }
  }, [config, getCurrentContext]);

  const handleNetworkError = useCallback(async (error: any, retryFn?: () => Promise<any>) => {
    await handleError(error, 'network_operation');
    
    if (retryFn) {
      await ErrorHandlingService.handleNetworkError(error, retryFn, getCurrentContext());
    } else {
      await ErrorHandlingService.handleNetworkError(error, undefined, getCurrentContext());
    }
  }, [handleError, getCurrentContext]);

  const handleApiError = useCallback(async (error: any, context?: string) => {
    await handleError(error, context || 'api_operation');
    await ErrorHandlingService.handleApiError(error, {
      ...getCurrentContext(),
      action: context,
    });
  }, [handleError, getCurrentContext]);

  const handleValidationError = useCallback(async (errors: { field: string; message: string }[]) => {
    const validationError = {
      message: 'Validation failed',
      validationErrors: errors,
    };
    
    await handleError(validationError, 'validation');
    await ErrorHandlingService.handleValidationError(errors, getCurrentContext());
  }, [handleError, getCurrentContext]);

  const handlePaymentError = useCallback(async (error: any, amount?: number) => {
    await handleError(error, 'payment_operation');
    await ErrorHandlingService.handlePaymentError(error, {
      ...getCurrentContext(),
      amount,
    });
  }, [handleError, getCurrentContext]);

  const retry = useCallback(async (operation: () => Promise<any>): Promise<any> => {
    if (errorState.retryCount >= config.retryAttempts!) {
      Alert.alert(
        'Maximum Retries Exceeded',
        'The operation has failed multiple times. Please try again later or contact support.',
        [{ text: 'OK' }]
      );
      return null;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      // Add delay before retry
      if (config.retryDelay! > 0) {
        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, config.retryDelay!);
        });
      }

      const result = await operation();
      
      // Clear error state on successful retry
      clearError();
      
      return result;
    } catch (retryError) {
      setErrorState(prev => ({
        ...prev,
        isRetrying: false,
        error: retryError,
        errorMessage: (retryError as any)?.message || 'Retry failed',
      }));

      await handleError(retryError, 'retry_operation');
      throw retryError;
    }
  }, [errorState.retryCount, config, clearError, handleError]);

  const showErrorDetails = useCallback(() => {
    if (!errorState.error) return;

    const errorInfo = {
      message: errorState.errorMessage,
      code: errorState.error?.code || errorState.error?.response?.status || 'UNKNOWN',
      timestamp: new Date().toLocaleString(),
      screen: route.name,
    };

    Alert.alert(
      'Error Details',
      `Message: ${errorInfo.message}\nCode: ${errorInfo.code}\nScreen: ${errorInfo.screen}\nTime: ${errorInfo.timestamp}`,
      [
        {
          text: 'Copy Error',
          onPress: () => {
            // In a real app, you might use Clipboard.setString here
            console.log('Error details copied:', errorInfo);
          }
        },
        { text: 'OK' }
      ]
    );
  }, [errorState.error, errorState.errorMessage, route.name]);

  const withErrorHandling = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    try {
      clearError();
      const result = await operation();
      return result;
    } catch (error) {
      await handleError(error, 'wrapped_operation');
      return null;
    }
  }, [clearError, handleError]);

  const checkNetworkAndExecute = useCallback(async (operation: () => Promise<any>): Promise<any> => {
    try {
      const networkState = await NetInfo.fetch();
      
      if (!networkState.isConnected) {
        const networkError = new Error('No internet connection available');
        await handleNetworkError(networkError);
        return null;
      }

      return await withErrorHandling(operation);
    } catch (error) {
      await handleNetworkError(error, () => checkNetworkAndExecute(operation));
      return null;
    }
  }, [handleNetworkError, withErrorHandling]);

  return {
    errorState,
    handleError,
    handleNetworkError,
    handleApiError,
    handleValidationError,
    handlePaymentError,
    retry,
    clearError,
    showErrorDetails,
    withErrorHandling,
    checkNetworkAndExecute,
  };
};

/**
 * Higher-order component for error boundaries
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType<{ error: Error; resetError: () => void }>
) => {
  const WrappedComponent = (props: P) => {
    const { errorState, clearError } = useErrorHandler();

    if (errorState.hasError && fallbackComponent) {
      const FallbackComponent = fallbackComponent;
      return React.createElement(FallbackComponent, {
        error: errorState.error,
        resetError: clearError,
      });
    }

    return React.createElement(Component, props);
  };
  
  return WrappedComponent;
};

/**
 * Custom hook for API operations with built-in error handling
 */
export const useApiOperation = () => {
  const { handleApiError, withErrorHandling, checkNetworkAndExecute } = useErrorHandler({
    showUserFeedback: true,
    retryAttempts: 2,
  });

  const executeApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options?: {
      showLoading?: boolean;
      context?: string;
      requireNetwork?: boolean;
    }
  ): Promise<T | null> => {
    const { requireNetwork = true, context } = options || {};

    try {
      if (requireNetwork) {
        return await checkNetworkAndExecute(apiCall);
      } else {
        return await withErrorHandling(apiCall);
      }
    } catch (error) {
      await handleApiError(error, context);
      return null;
    }
  }, [handleApiError, withErrorHandling, checkNetworkAndExecute]);

  return { executeApiCall };
};

export default useErrorHandler;