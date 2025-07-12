// src/services/UserDataErrorHandler.ts
import { useNetInfo } from '@react-native-community/netinfo';
import UserDataStorageService from './UserDataStorageService';
import { ComprehensiveUserData } from '../types/api';

/**
 * Error types for user data operations
 */
export enum UserDataErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * User data error class with enhanced information
 */
export class UserDataError extends Error {
  public readonly type: UserDataErrorType;
  public readonly statusCode?: number;
  public readonly retryable: boolean;
  public readonly timestamp: number;

  constructor(
    message: string,
    type: UserDataErrorType,
    statusCode?: number,
    retryable: boolean = true
  ) {
    super(message);
    this.name = 'UserDataError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.timestamp = Date.now();
  }
}

/**
 * Service for handling user data errors with intelligent retry and fallback strategies
 */
class UserDataErrorHandler {
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly BASE_RETRY_DELAY = 1000; // 1 second
  private static readonly MAX_RETRY_DELAY = 30000; // 30 seconds

  /**
   * Classify error type based on error object
   */
  static classifyError(error: any): UserDataErrorType {
    if (!error) return UserDataErrorType.UNKNOWN_ERROR;

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return UserDataErrorType.NETWORK_ERROR;
    }

    // HTTP status code based classification
    if (error.response?.status) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        return UserDataErrorType.AUTH_ERROR;
      }
      if (status >= 500) {
        return UserDataErrorType.SERVER_ERROR;
      }
      if (status >= 400) {
        return UserDataErrorType.NETWORK_ERROR;
      }
    }

    // Cache errors
    if (error.message?.includes('AsyncStorage') || error.message?.includes('cache')) {
      return UserDataErrorType.CACHE_ERROR;
    }

    return UserDataErrorType.UNKNOWN_ERROR;
  }

  /**
   * Determine if error is retryable
   */
  static isRetryable(error: any, attemptCount: number): boolean {
    if (attemptCount >= this.MAX_RETRY_ATTEMPTS) {
      return false;
    }

    const errorType = this.classifyError(error);

    switch (errorType) {
      case UserDataErrorType.AUTH_ERROR:
        return false; // Don't retry auth errors
      case UserDataErrorType.NETWORK_ERROR:
      case UserDataErrorType.SERVER_ERROR:
        return true; // Retry network and server errors
      case UserDataErrorType.CACHE_ERROR:
        return false; // Don't retry cache errors
      case UserDataErrorType.UNKNOWN_ERROR:
        return attemptCount < 2; // Limited retries for unknown errors
      default:
        return false;
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static calculateRetryDelay(attemptIndex: number): number {
    const delay = this.BASE_RETRY_DELAY * Math.pow(2, attemptIndex);
    return Math.min(delay, this.MAX_RETRY_DELAY);
  }

  /**
   * Create a UserDataError from a generic error
   */
  static createUserDataError(error: any): UserDataError {
    const errorType = this.classifyError(error);
    const statusCode = error.response?.status;
    const retryable = this.isRetryable(error, 0);

    let message = 'Failed to fetch user data';
    if (error.message) {
      message = error.message;
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    }

    return new UserDataError(message, errorType, statusCode, retryable);
  }

  /**
   * Handle user data fetch error with fallback strategies
   */
  static async handleUserDataError(
    error: any,
    userId: number,
    attemptCount: number = 0
  ): Promise<ComprehensiveUserData | null> {
    console.error('[UserDataErrorHandler] Handling user data error:', {
      error: error.message,
      userId,
      attemptCount,
      errorType: this.classifyError(error),
    });

    const userDataError = this.createUserDataError(error);

    // Try to get cached data as fallback
    try {
      console.log('[UserDataErrorHandler] Attempting to retrieve cached data as fallback');
      
      // First try to get valid cached data
      const validCachedData = await UserDataStorageService.getValidUserData(userId);
      if (validCachedData) {
        console.log('[UserDataErrorHandler] Using valid cached data as fallback');
        return validCachedData;
      }

      // If no valid cache, try any cached data for critical errors
      if (userDataError.type === UserDataErrorType.AUTH_ERROR || 
          userDataError.type === UserDataErrorType.SERVER_ERROR) {
        const anyCachedData = await UserDataStorageService.getUserData(userId);
        if (anyCachedData) {
          console.log('[UserDataErrorHandler] Using expired cached data as emergency fallback');
          return anyCachedData;
        }
      }
    } catch (cacheError) {
      console.error('[UserDataErrorHandler] Failed to retrieve cached data:', cacheError);
    }

    // If no fallback data available, throw the original error
    throw userDataError;
  }

  /**
   * Log error for analytics and debugging
   */
  static logError(error: UserDataError, userId: number, context?: string): void {
    const logData = {
      errorType: error.type,
      message: error.message,
      statusCode: error.statusCode,
      retryable: error.retryable,
      timestamp: error.timestamp,
      userId,
      context,
    };

    console.error('[UserDataErrorHandler] Error logged:', logData);

    // Here you could send to analytics service
    // Analytics.track('user_data_error', logData);
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: UserDataError): string {
    switch (error.type) {
      case UserDataErrorType.NETWORK_ERROR:
        return 'Please check your internet connection and try again.';
      case UserDataErrorType.AUTH_ERROR:
        return 'Please log in again to continue.';
      case UserDataErrorType.SERVER_ERROR:
        return 'Our servers are temporarily unavailable. Please try again later.';
      case UserDataErrorType.CACHE_ERROR:
        return 'There was an issue accessing your saved data.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  /**
   * Check if device is online
   */
  static async isOnline(): Promise<boolean> {
    try {
      // This would need to be called from a component with useNetInfo
      // For now, we'll assume online
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create retry function with exponential backoff
   */
  static createRetryFunction<T>(
    fn: () => Promise<T>,
    maxAttempts: number = this.MAX_RETRY_ATTEMPTS
  ): () => Promise<T> {
    return async (): Promise<T> => {
      let lastError: any;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error;

          if (!this.isRetryable(error, attempt)) {
            throw error;
          }

          if (attempt < maxAttempts - 1) {
            const delay = this.calculateRetryDelay(attempt);
            console.log(`[UserDataErrorHandler] Retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError;
    };
  }
}

/**
 * React hook for handling user data errors
 */
export const useUserDataErrorHandler = () => {
  const netInfo = useNetInfo();

  const handleError = async (error: any, userId: number, attemptCount: number = 0) => {
    return UserDataErrorHandler.handleUserDataError(error, userId, attemptCount);
  };

  const isOnline = netInfo.isConnected ?? true;

  const getUserFriendlyMessage = (error: any) => {
    const userDataError = UserDataErrorHandler.createUserDataError(error);
    return UserDataErrorHandler.getUserFriendlyMessage(userDataError);
  };

  const shouldRetry = (error: any, attemptCount: number) => {
    return UserDataErrorHandler.isRetryable(error, attemptCount) && isOnline;
  };

  return {
    handleError,
    getUserFriendlyMessage,
    shouldRetry,
    isOnline,
    classifyError: UserDataErrorHandler.classifyError,
    logError: UserDataErrorHandler.logError,
  };
};

export default UserDataErrorHandler;
