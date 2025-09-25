/**
 * Comprehensive Error Handling Service
 * Provides centralized error handling across the application
 */

import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  userId?: string;
  screen?: string;
  action?: string;
}

export interface RecoveryAction {
  label: string;
  action: () => Promise<void> | void;
}

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorLog: ErrorDetails[] = [];
  private maxLogSize = 100;

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Log error to local storage and console
   */
  async logError(error: any, context?: {
    screen?: string;
    action?: string;
    userId?: string;
    additionalData?: any;
  }): Promise<void> {
    const errorDetails: ErrorDetails = {
      code: this.extractErrorCode(error),
      message: this.extractErrorMessage(error),
      details: {
        originalError: error,
        stack: error?.stack,
        ...context?.additionalData
      },
      timestamp: new Date().toISOString(),
      userId: context?.userId || await this.getCurrentUserId(),
      screen: context?.screen,
      action: context?.action
    };

    // Add to in-memory log
    this.errorLog.unshift(errorDetails);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Persist to AsyncStorage
    try {
      await AsyncStorage.setItem('error_log', JSON.stringify(this.errorLog));
    } catch (storageError) {
      console.error('Failed to save error log to storage:', storageError);
    }

    // Console logging
    console.error('🚨 [ErrorHandlingService] Error logged:', errorDetails);
  }

  /**
   * Handle network errors with retry capabilities
   */
  async handleNetworkError(
    error: any,
    retryFunction?: () => Promise<any>,
    context?: { screen?: string; action?: string }
  ): Promise<void> {
    const networkState = await NetInfo.fetch();
    
    await this.logError(error, {
      ...context,
      additionalData: {
        networkState,
        errorType: 'network'
      }
    });

    const recoveryActions: RecoveryAction[] = [];

    // Add retry action if function provided
    if (retryFunction) {
      recoveryActions.push({
        label: 'Retry',
        action: async () => {
          try {
            await retryFunction();
          } catch (retryError) {
            this.handleNetworkError(retryError, retryFunction, context);
          }
        }
      });
    }

    // Add network check action
    recoveryActions.push({
      label: 'Check Connection',
      action: () => {
        this.showNetworkStatusAlert();
      }
    });

    this.showErrorDialog({
      title: 'Network Error',
      message: networkState.isConnected 
        ? 'Server is unreachable. Please check your internet connection or try again later.'
        : 'No internet connection detected. Please check your network settings.',
      recoveryActions
    });
  }

  /**
   * Handle API errors with appropriate user feedback
   */
  async handleApiError(
    error: any,
    context?: { 
      screen?: string; 
      action?: string;
      showUserFriendlyMessage?: boolean;
    }
  ): Promise<void> {
    await this.logError(error, {
      ...context,
      additionalData: {
        errorType: 'api',
        status: error?.response?.status,
        responseData: error?.response?.data
      }
    });

    const status = error?.response?.status;
    const errorData = error?.response?.data;

    // Handle specific API error cases
    switch (status) {
      case 400:
        this.showErrorDialog({
          title: 'Invalid Request',
          message: errorData?.message || 'The request could not be processed. Please check your input and try again.',
        });
        break;

      case 401:
        // Handle unauthorized - don't show dialog as ApiService handles this
        console.log('🔐 Unauthorized error handled by ApiService interceptor');
        break;

      case 403:
        this.showErrorDialog({
          title: 'Access Denied',
          message: 'You do not have permission to perform this action.',
        });
        break;

      case 404:
        this.showErrorDialog({
          title: 'Not Found',
          message: 'The requested resource was not found. It may have been removed or is temporarily unavailable.',
        });
        break;

      case 422:
        this.showErrorDialog({
          title: 'Validation Error',
          message: errorData?.message || 'Please check your input and try again.',
        });
        break;

      case 429:
        this.showErrorDialog({
          title: 'Rate Limit Exceeded',
          message: 'Too many requests. Please wait a moment and try again.',
        });
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        this.showErrorDialog({
          title: 'Server Error',
          message: 'Server is temporarily unavailable. Please try again later.',
          recoveryActions: [
            {
              label: 'Contact Support',
              action: () => this.showContactSupport()
            }
          ]
        });
        break;

      default:
        if (context?.showUserFriendlyMessage !== false) {
          this.showErrorDialog({
            title: 'Something went wrong',
            message: this.extractUserFriendlyMessage(error),
          });
        }
    }
  }

  /**
   * Handle validation errors with field-specific feedback
   */
  async handleValidationError(
    validationErrors: { field: string; message: string }[],
    context?: { screen?: string }
  ): Promise<void> {
    await this.logError({
      message: 'Validation errors occurred',
      validationErrors
    }, {
      ...context,
      additionalData: {
        errorType: 'validation'
      }
    });

    const errorMessage = validationErrors
      .map(err => `• ${err.field}: ${err.message}`)
      .join('\n');

    this.showErrorDialog({
      title: 'Validation Error',
      message: `Please correct the following errors:\n\n${errorMessage}`,
    });
  }

  /**
   * Handle authentication errors
   */
  async handleAuthError(
    error: any,
    context?: { screen?: string; action?: string }
  ): Promise<void> {
    await this.logError(error, {
      ...context,
      additionalData: {
        errorType: 'auth'
      }
    });

    this.showErrorDialog({
      title: 'Authentication Required',
      message: 'Please log in to continue using the app.',
      recoveryActions: [
        {
          label: 'Login',
          action: () => {
            // Navigate to login - this will be handled by navigation service
            console.log('Navigation to login required');
          }
        }
      ]
    });
  }

  /**
   * Handle payment errors
   */
  async handlePaymentError(
    error: any,
    context?: { screen?: string; action?: string; amount?: number }
  ): Promise<void> {
    await this.logError(error, {
      ...context,
      additionalData: {
        errorType: 'payment',
        amount: context?.amount
      }
    });

    const errorMessage = this.extractPaymentErrorMessage(error);
    
    this.showErrorDialog({
      title: 'Payment Failed',
      message: errorMessage,
      recoveryActions: [
        {
          label: 'Try Again',
          action: () => {
            console.log('Payment retry requested');
          }
        },
        {
          label: 'Contact Support',
          action: () => this.showContactSupport()
        }
      ]
    });
  }

  /**
   * Show error dialog with recovery options
   */
  private showErrorDialog({
    title,
    message,
    recoveryActions = []
  }: {
    title: string;
    message: string;
    recoveryActions?: RecoveryAction[];
  }): void {
    const buttons = [
      ...recoveryActions.map(action => ({
        text: action.label,
        onPress: action.action
      })),
      { text: 'OK', style: 'cancel' as const }
    ];

    Alert.alert(title, message, buttons, { cancelable: true });
  }

  /**
   * Show network status information
   */
  private async showNetworkStatusAlert(): Promise<void> {
    try {
      const networkState = await NetInfo.fetch();
      
      let message = `Connection: ${networkState.isConnected ? 'Connected' : 'Disconnected'}\n`;
      message += `Type: ${networkState.type}\n`;
      
      if (networkState.details) {
        message += `Details: ${JSON.stringify(networkState.details, null, 2)}`;
      }

      Alert.alert('Network Status', message);
    } catch (error) {
      Alert.alert('Network Status', 'Unable to check network status');
    }
  }

  /**
   * Show contact support options
   */
  private showContactSupport(): void {
    Alert.alert(
      'Contact Support',
      'Need help? Choose how you\'d like to contact our support team:',
      [
        { text: 'Email Support', onPress: () => console.log('Email support requested') },
        { text: 'In-App Chat', onPress: () => console.log('In-app chat requested') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }

  /**
   * Extract error code from various error formats
   */
  private extractErrorCode(error: any): string {
    if (error?.code) return error.code;
    if (error?.response?.status) return `HTTP_${error.response.status}`;
    if (error?.name) return error.name;
    return 'UNKNOWN_ERROR';
  }

  /**
   * Extract user-friendly error message
   */
  private extractErrorMessage(error: any): string {
    if (error?.message) return error.message;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.response?.statusText) return error.response.statusText;
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred';
  }

  /**
   * Extract user-friendly message for general display
   */
  private extractUserFriendlyMessage(error: any): string {
    const message = this.extractErrorMessage(error);
    
    // Convert technical messages to user-friendly ones
    if (message.toLowerCase().includes('network')) {
      return 'Please check your internet connection and try again.';
    }
    
    if (message.toLowerCase().includes('timeout')) {
      return 'The request timed out. Please try again.';
    }
    
    if (message.toLowerCase().includes('server')) {
      return 'Server is temporarily unavailable. Please try again later.';
    }
    
    return message.length > 100 
      ? 'Something went wrong. Please try again or contact support if the problem persists.'
      : message;
  }

  /**
   * Extract payment-specific error messages
   */
  private extractPaymentErrorMessage(error: any): string {
    const code = error?.code || error?.error?.code;
    const reason = error?.reason || error?.error?.reason;
    const description = error?.description || error?.error?.description;

    if (code === 'BAD_REQUEST_ERROR') {
      if (reason === 'payment_cancelled' || description?.toLowerCase().includes('cancel')) {
        return 'Payment was cancelled. Please try again when ready.';
      }
      if (reason === 'payment_failed') {
        return 'Payment failed. Please check your payment method and try again.';
      }
    }

    if (code === 'NETWORK_ERROR') {
      return 'Network error during payment. Please check your connection and try again.';
    }

    return description || reason || 'Payment could not be processed. Please try again.';
  }

  /**
   * Get current user ID from storage
   */
  private async getCurrentUserId(): Promise<string | undefined> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user?.id?.toString();
      }
    } catch (error) {
      console.error('Failed to get current user ID:', error);
    }
    return undefined;
  }

  /**
   * Get error statistics for debugging
   */
  async getErrorStatistics(): Promise<{
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: ErrorDetails[];
  }> {
    try {
      const logStr = await AsyncStorage.getItem('error_log');
      const log: ErrorDetails[] = logStr ? JSON.parse(logStr) : this.errorLog;

      const errorsByType: Record<string, number> = {};
      log.forEach(error => {
        const type = error.details?.errorType || 'unknown';
        errorsByType[type] = (errorsByType[type] || 0) + 1;
      });

      return {
        totalErrors: log.length,
        errorsByType,
        recentErrors: log.slice(0, 10)
      };
    } catch (error) {
      console.error('Failed to get error statistics:', error);
      return {
        totalErrors: 0,
        errorsByType: {},
        recentErrors: []
      };
    }
  }

  /**
   * Clear error log
   */
  async clearErrorLog(): Promise<void> {
    try {
      this.errorLog = [];
      await AsyncStorage.removeItem('error_log');
    } catch (error) {
      console.error('Failed to clear error log:', error);
    }
  }

  /**
   * Export error log for debugging
   */
  async exportErrorLog(): Promise<string> {
    try {
      const logStr = await AsyncStorage.getItem('error_log');
      const log: ErrorDetails[] = logStr ? JSON.parse(logStr) : this.errorLog;
      
      return JSON.stringify({
        exportDate: new Date().toISOString(),
        platform: Platform.OS,
        errors: log
      }, null, 2);
    } catch (error) {
      console.error('Failed to export error log:', error);
      return JSON.stringify({ error: 'Failed to export log' });
    }
  }
}

export default ErrorHandlingService.getInstance();