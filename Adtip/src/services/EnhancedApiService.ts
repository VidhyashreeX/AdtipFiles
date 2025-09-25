/**
 * Enhanced API Service with Comprehensive Error Handling
 * Extends the existing ApiService with better error handling capabilities
 */

import ApiService from './ApiService';
import ErrorHandlingService from './ErrorHandlingService';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

export interface ApiCallOptions {
  showLoader?: boolean;
  showErrorDialog?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  requireNetwork?: boolean;
  context?: string;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data?: T;
  error?: any;
}

class EnhancedApiService {
  private static readonly DEFAULT_OPTIONS: ApiCallOptions = {
    showLoader: false,
    showErrorDialog: true,
    retryAttempts: 2,
    retryDelay: 1000,
    requireNetwork: true,
    timeout: 30000,
  };

  /**
   * Enhanced API call with comprehensive error handling
   */
  static async callWithErrorHandling<T = any>(
    apiCall: () => Promise<any>,
    options: ApiCallOptions = {}
  ): Promise<ApiResponse<T>> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    let lastError: any = null;

    // Check network connection if required
    if (config.requireNetwork) {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        const networkError = {
          message: 'No internet connection available',
          code: 'NETWORK_UNAVAILABLE',
        };

        if (config.showErrorDialog) {
          await ErrorHandlingService.handleNetworkError(networkError);
        }

        return {
          status: false,
          message: networkError.message,
          error: networkError,
        };
      }
    }

    // Retry logic
    for (let attempt = 0; attempt <= config.retryAttempts!; attempt++) {
      try {
        const result = await apiCall();
        
        // Log successful API call
        console.log(`✅ API call successful on attempt ${attempt + 1}`);
        
        return {
          status: true,
          message: 'Success',
          data: result,
        };

      } catch (error: any) {
        lastError = error;
        console.error(`❌ API call failed on attempt ${attempt + 1}:`, error);

        // Log the error
        await ErrorHandlingService.logError(error, {
          action: config.context || 'api_call',
          additionalData: {
            attempt: attempt + 1,
            maxAttempts: config.retryAttempts! + 1,
          },
        });

        // If this is not the last attempt, wait and retry
        if (attempt < config.retryAttempts!) {
          console.log(`🔄 Retrying in ${config.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
          continue;
        }

        // Last attempt failed, handle the error
        if (config.showErrorDialog) {
          await this.handleApiError(error, config.context);
        }

        return {
          status: false,
          message: this.extractErrorMessage(error),
          error,
        };
      }
    }

    // This should never be reached, but TypeScript requires it
    return {
      status: false,
      message: this.extractErrorMessage(lastError),
      error: lastError,
    };
  }

  /**
   * Enhanced login with better error handling
   */
  static async loginWithErrorHandling(mobileNumber: string): Promise<ApiResponse> {
    return this.callWithErrorHandling(
      () => ApiService.sendLoginOtp({ 
        mobileNumber: mobileNumber,
        userType: 'user'
      }),
      {
        context: 'user_login',
        showErrorDialog: true,
        retryAttempts: 1,
      }
    );
  }

  /**
   * Enhanced OTP verification
   */
  static async verifyOtpWithErrorHandling(
    mobileNumber: string, 
    otp: string,
    userId: string
  ): Promise<ApiResponse> {
    return this.callWithErrorHandling(
      () => ApiService.verifyOtp({ 
        mobile_number: mobileNumber, 
        otp,
        id: userId
      }),
      {
        context: 'otp_verification',
        showErrorDialog: true,
        retryAttempts: 0, // Don't retry OTP verification
      }
    );
  }

  /**
   * Enhanced media upload
   */
  static async uploadMediaWithErrorHandling(mediaData: any): Promise<ApiResponse> {
    return this.callWithErrorHandling(
      () => ApiService.uploadStatus(mediaData),
      {
        context: 'media_upload',
        showErrorDialog: true,
        retryAttempts: 1,
        timeout: 60000, // Longer timeout for uploads
      }
    );
  }

  /**
   * Enhanced call operations
   */
  static async initiateCallWithErrorHandling(callData: any): Promise<ApiResponse> {
    return this.callWithErrorHandling(
      () => ApiService.initiateCall(callData),
      {
        context: 'call_initiation',
        showErrorDialog: true,
        retryAttempts: 1,
      }
    );
  }

  /**
   * Enhanced data fetching
   */
  static async fetchDataWithErrorHandling<T = any>(
    fetchFunction: () => Promise<T>,
    context: string = 'data_fetch'
  ): Promise<ApiResponse<T>> {
    return this.callWithErrorHandling(
      fetchFunction,
      {
        context,
        showErrorDialog: false, // Don't show dialogs for data fetching
        retryAttempts: 2,
      }
    );
  }

  /**
   * Batch API calls with error handling
   */
  static async batchCallsWithErrorHandling(
    calls: Array<{ name: string; call: () => Promise<any> }>,
    options: { stopOnError?: boolean } = {}
  ): Promise<Record<string, ApiResponse>> {
    const results: Record<string, ApiResponse> = {};
    
    for (const { name, call } of calls) {
      try {
        const result = await this.callWithErrorHandling(call, {
          context: `batch_${name}`,
          showErrorDialog: false,
          retryAttempts: 1,
        });

        results[name] = result;

        if (!result.status && options.stopOnError) {
          console.log(`🛑 Batch operation stopped at ${name} due to error`);
          break;
        }
      } catch (error) {
        results[name] = {
          status: false,
          message: this.extractErrorMessage(error),
          error,
        };

        if (options.stopOnError) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Handle API errors with appropriate user feedback
   */
  private static async handleApiError(error: any, context?: string): Promise<void> {
    await ErrorHandlingService.handleApiError(error, {
      action: context,
      showUserFriendlyMessage: true,
    });
  }

  /**
   * Extract user-friendly error message
   */
  private static extractErrorMessage(error: any): string {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    if (error?.response?.statusText) {
      return error.response.statusText;
    }
    
    return 'An unexpected error occurred';
  }

  /**
   * Check API health with error handling
   */
  static async checkApiHealth(): Promise<{
    isHealthy: boolean;
    responseTime: number;
    error?: any;
  }> {
    const startTime = Date.now();
    
    try {
      await this.callWithErrorHandling(
        () => ApiService.ping(),
        {
          context: 'health_check',
          showErrorDialog: false,
          retryAttempts: 0,
          timeout: 5000,
        }
      );

      return {
        isHealthy: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        error,
      };
    }
  }

  /**
   * Network-aware API call
   */
  static async networkAwareCall<T = any>(
    apiCall: () => Promise<T>,
    fallbackData?: T
  ): Promise<{ data: T | null; fromCache: boolean; error?: any }> {
    try {
      const networkState = await NetInfo.fetch();
      
      if (!networkState.isConnected) {
        if (fallbackData !== undefined) {
          return { data: fallbackData, fromCache: true };
        }
        
        throw new Error('No network connection and no fallback data available');
      }

      const result = await this.callWithErrorHandling(apiCall, {
        showErrorDialog: false,
        retryAttempts: 1,
      });

      return {
        data: result.status ? result.data : null,
        fromCache: false,
        error: result.status ? undefined : result.error,
      };
    } catch (error) {
      if (fallbackData !== undefined) {
        return { data: fallbackData, fromCache: true, error };
      }
      
      return { data: null, fromCache: false, error };
    }
  }

  /**
   * Optimistic API call (show success immediately, handle errors in background)
   */
  static async optimisticCall<T = any>(
    apiCall: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: any) => void
  ): Promise<void> {
    try {
      const result = await this.callWithErrorHandling(apiCall, {
        showErrorDialog: false,
        retryAttempts: 2,
      });

      if (result.status && onSuccess) {
        onSuccess(result.data);
      } else if (!result.status && onError) {
        onError(result.error);
      }
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        // Log error silently
        await ErrorHandlingService.logError(error, {
          action: 'optimistic_call',
        });
      }
    }
  }
}

export default EnhancedApiService;