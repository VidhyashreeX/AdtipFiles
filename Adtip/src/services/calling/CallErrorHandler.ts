// src/services/calling/CallErrorHandler.ts

import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appEventEmitter } from '../../events/AppEventEmitter';

/**
 * Enhanced error types for comprehensive error handling
 */
export enum CallErrorType {
  NETWORK = 'NETWORK',
  PERMISSION = 'PERMISSION',
  MEDIA = 'MEDIA',
  AUTHENTICATION = 'AUTHENTICATION',
  MEETING = 'MEETING',
  UNKNOWN = 'UNKNOWN',
  FATAL = 'FATAL',
}

export enum CallErrorCode {
  // Network errors
  CONNECTION_LOST = 'CONNECTION_LOST',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  POOR_CONNECTION = 'POOR_CONNECTION',
  
  // Permission errors
  MICROPHONE_PERMISSION_DENIED = 'MICROPHONE_PERMISSION_DENIED',
  CAMERA_PERMISSION_DENIED = 'CAMERA_PERMISSION_DENIED',
  NOTIFICATION_PERMISSION_DENIED = 'NOTIFICATION_PERMISSION_DENIED',
  
  // Media errors
  MICROPHONE_NOT_AVAILABLE = 'MICROPHONE_NOT_AVAILABLE',
  CAMERA_NOT_AVAILABLE = 'CAMERA_NOT_AVAILABLE',
  AUDIO_DEVICE_ERROR = 'AUDIO_DEVICE_ERROR',
  
  // Authentication errors
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Meeting errors
  MEETING_NOT_FOUND = 'MEETING_NOT_FOUND',
  MEETING_ENDED = 'MEETING_ENDED',
  MEETING_FULL = 'MEETING_FULL',
  
  // Fatal errors
  VIDEOSDK_INITIALIZATION_FAILED = 'VIDEOSDK_INITIALIZATION_FAILED',
  CALL_SERVICE_UNAVAILABLE = 'CALL_SERVICE_UNAVAILABLE',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface CallError {
  type: CallErrorType;
  code: CallErrorCode;
  message: string;
  details?: any;
  timestamp: number;
  callId?: string;
  recoverable: boolean;
}

export interface ErrorRecoveryStrategy {
  maxAttempts: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  userAction?: 'RETRY' | 'END_CALL' | 'SWITCH_TO_VOICE' | 'IGNORE';
}

/**
 * BULLETPROOF Call Error Handler
 * Provides comprehensive error handling, recovery strategies, and user feedback
 */
class CallErrorHandler {
  private static instance: CallErrorHandler;
  private errorHistory: CallError[] = [];
  private recoveryAttempts: Map<string, number> = new Map();
  private readonly ERROR_HISTORY_KEY = 'CALL_ERROR_HISTORY';
  private readonly MAX_HISTORY_SIZE = 50;

  private constructor() {
    this.loadErrorHistory();
  }

  public static getInstance(): CallErrorHandler {
    if (!CallErrorHandler.instance) {
      CallErrorHandler.instance = new CallErrorHandler();
    }
    return CallErrorHandler.instance;
  }

  /**
   * Handle an error with comprehensive categorization and recovery
   */
  public async handleError(error: any, callId?: string, context?: string): Promise<boolean> {
    try {
      // Categorize the error
      const callError = this.categorizeError(error, callId, context);
      
      // Log the error
      this.logError(callError);
      
      // Add to history
      this.addToHistory(callError);
      
      // Determine recovery strategy
      const strategy = this.getRecoveryStrategy(callError);
      
      // Attempt recovery if possible
      if (callError.recoverable && strategy) {
        return await this.attemptRecovery(callError, strategy);
      } else {
        // Show user feedback for non-recoverable errors
        this.showUserFeedback(callError);
        return false;
      }
    } catch (handlerError) {
      console.error('[CallErrorHandler] Error in error handler:', handlerError);
      return false;
    }
  }

  /**
   * Categorize error into appropriate type and code
   */
  private categorizeError(error: any, callId?: string, context?: string): CallError {
    const timestamp = Date.now();
    
    // Extract error information
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorCode = error?.code || error?.name;
    
    // Network errors
    if (this.isNetworkError(error)) {
      return {
        type: CallErrorType.NETWORK,
        code: this.getNetworkErrorCode(error),
        message: errorMessage,
        details: { originalError: error, context },
        timestamp,
        callId,
        recoverable: true,
      };
    }
    
    // Permission errors
    if (this.isPermissionError(error)) {
      return {
        type: CallErrorType.PERMISSION,
        code: this.getPermissionErrorCode(error),
        message: errorMessage,
        details: { originalError: error, context },
        timestamp,
        callId,
        recoverable: true,
      };
    }
    
    // Media errors
    if (this.isMediaError(error)) {
      return {
        type: CallErrorType.MEDIA,
        code: this.getMediaErrorCode(error),
        message: errorMessage,
        details: { originalError: error, context },
        timestamp,
        callId,
        recoverable: true,
      };
    }
    
    // Authentication errors
    if (this.isAuthenticationError(error)) {
      return {
        type: CallErrorType.AUTHENTICATION,
        code: this.getAuthenticationErrorCode(error),
        message: errorMessage,
        details: { originalError: error, context },
        timestamp,
        callId,
        recoverable: false,
      };
    }
    
    // Meeting errors
    if (this.isMeetingError(error)) {
      return {
        type: CallErrorType.MEETING,
        code: this.getMeetingErrorCode(error),
        message: errorMessage,
        details: { originalError: error, context },
        timestamp,
        callId,
        recoverable: false,
      };
    }
    
    // Fatal errors
    if (this.isFatalError(error)) {
      return {
        type: CallErrorType.FATAL,
        code: CallErrorCode.CALL_SERVICE_UNAVAILABLE,
        message: errorMessage,
        details: { originalError: error, context },
        timestamp,
        callId,
        recoverable: false,
      };
    }
    
    // Unknown errors - treat as recoverable by default
    return {
      type: CallErrorType.UNKNOWN,
      code: CallErrorCode.UNKNOWN_ERROR,
      message: errorMessage,
      details: { originalError: error, context },
      timestamp,
      callId,
      recoverable: true,
    };
  }

  /**
   * Error type detection methods
   */
  private isNetworkError(error: any): boolean {
    const networkKeywords = ['network', 'connection', 'timeout', 'unreachable', 'fetch'];
    const errorString = (error?.message || error?.toString() || '').toLowerCase();
    return networkKeywords.some(keyword => errorString.includes(keyword));
  }

  private isPermissionError(error: any): boolean {
    const permissionKeywords = ['permission', 'denied', 'microphone', 'camera', 'media'];
    const errorString = (error?.message || error?.toString() || '').toLowerCase();
    return permissionKeywords.some(keyword => errorString.includes(keyword));
  }

  private isMediaError(error: any): boolean {
    const mediaKeywords = ['audio', 'video', 'device', 'track', 'stream'];
    const errorString = (error?.message || error?.toString() || '').toLowerCase();
    return mediaKeywords.some(keyword => errorString.includes(keyword));
  }

  private isAuthenticationError(error: any): boolean {
    const authKeywords = ['token', 'unauthorized', 'authentication', 'forbidden'];
    const errorString = (error?.message || error?.toString() || '').toLowerCase();
    return authKeywords.some(keyword => errorString.includes(keyword));
  }

  private isMeetingError(error: any): boolean {
    const meetingKeywords = ['meeting', 'room', 'session', 'ended'];
    const errorString = (error?.message || error?.toString() || '').toLowerCase();
    return meetingKeywords.some(keyword => errorString.includes(keyword));
  }

  private isFatalError(error: any): boolean {
    const fatalKeywords = ['videosdk', 'initialization', 'critical', 'fatal'];
    const errorString = (error?.message || error?.toString() || '').toLowerCase();
    return fatalKeywords.some(keyword => errorString.includes(keyword));
  }

  /**
   * Get specific error codes based on error content
   */
  private getNetworkErrorCode(error: any): CallErrorCode {
    const errorString = (error?.message || '').toLowerCase();
    if (errorString.includes('timeout')) return CallErrorCode.NETWORK_TIMEOUT;
    if (errorString.includes('connection')) return CallErrorCode.CONNECTION_LOST;
    return CallErrorCode.POOR_CONNECTION;
  }

  private getPermissionErrorCode(error: any): CallErrorCode {
    const errorString = (error?.message || '').toLowerCase();
    if (errorString.includes('microphone')) return CallErrorCode.MICROPHONE_PERMISSION_DENIED;
    if (errorString.includes('camera')) return CallErrorCode.CAMERA_PERMISSION_DENIED;
    return CallErrorCode.NOTIFICATION_PERMISSION_DENIED;
  }

  private getMediaErrorCode(error: any): CallErrorCode {
    const errorString = (error?.message || '').toLowerCase();
    if (errorString.includes('microphone') || errorString.includes('audio')) return CallErrorCode.MICROPHONE_NOT_AVAILABLE;
    if (errorString.includes('camera') || errorString.includes('video')) return CallErrorCode.CAMERA_NOT_AVAILABLE;
    return CallErrorCode.AUDIO_DEVICE_ERROR;
  }

  private getAuthenticationErrorCode(error: any): CallErrorCode {
    const errorString = (error?.message || '').toLowerCase();
    if (errorString.includes('expired')) return CallErrorCode.TOKEN_EXPIRED;
    if (errorString.includes('invalid')) return CallErrorCode.INVALID_TOKEN;
    return CallErrorCode.UNAUTHORIZED;
  }

  private getMeetingErrorCode(error: any): CallErrorCode {
    const errorString = (error?.message || '').toLowerCase();
    if (errorString.includes('ended')) return CallErrorCode.MEETING_ENDED;
    if (errorString.includes('full')) return CallErrorCode.MEETING_FULL;
    return CallErrorCode.MEETING_NOT_FOUND;
  }

  /**
   * Get recovery strategy for error type
   */
  private getRecoveryStrategy(error: CallError): ErrorRecoveryStrategy | null {
    switch (error.type) {
      case CallErrorType.NETWORK:
        return {
          maxAttempts: 3,
          retryDelay: 2000,
          exponentialBackoff: true,
          userAction: 'RETRY',
        };
      
      case CallErrorType.MEDIA:
        return {
          maxAttempts: 2,
          retryDelay: 1000,
          exponentialBackoff: false,
          userAction: 'SWITCH_TO_VOICE',
        };
      
      case CallErrorType.PERMISSION:
        return {
          maxAttempts: 1,
          retryDelay: 0,
          exponentialBackoff: false,
          userAction: 'RETRY',
        };
      
      case CallErrorType.UNKNOWN:
        return {
          maxAttempts: 2,
          retryDelay: 1500,
          exponentialBackoff: false,
          userAction: 'RETRY',
        };
      
      default:
        return null; // No recovery for fatal, auth, or meeting errors
    }
  }

  /**
   * Attempt recovery based on strategy
   */
  private async attemptRecovery(error: CallError, strategy: ErrorRecoveryStrategy): Promise<boolean> {
    const errorKey = `${error.type}_${error.code}`;
    const currentAttempts = this.recoveryAttempts.get(errorKey) || 0;
    
    if (currentAttempts >= strategy.maxAttempts) {
      console.log(`[CallErrorHandler] Max recovery attempts reached for ${errorKey}`);
      this.showUserFeedback(error);
      return false;
    }
    
    // Increment attempt counter
    this.recoveryAttempts.set(errorKey, currentAttempts + 1);
    
    // Calculate retry delay with exponential backoff
    const delay = strategy.exponentialBackoff 
      ? strategy.retryDelay * Math.pow(2, currentAttempts)
      : strategy.retryDelay;
    
    console.log(`[CallErrorHandler] Attempting recovery for ${errorKey} (attempt ${currentAttempts + 1}/${strategy.maxAttempts})`);
    
    // Wait before retry
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Emit recovery event
    appEventEmitter.emit('callErrorRecovery', {
      error,
      strategy,
      attempt: currentAttempts + 1,
    });
    
    return true;
  }

  /**
   * Show appropriate user feedback
   */
  private showUserFeedback(error: CallError): void {
    const userMessage = this.getUserFriendlyMessage(error);
    const actions = this.getUserActions(error);
    
    Alert.alert(
      'Call Issue',
      userMessage,
      actions,
      { cancelable: false }
    );
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: CallError): string {
    switch (error.type) {
      case CallErrorType.NETWORK:
        return 'There seems to be a connection issue. Please check your internet connection and try again.';
      
      case CallErrorType.PERMISSION:
        return 'Camera or microphone permissions are required for calls. Please enable permissions in your device settings.';
      
      case CallErrorType.MEDIA:
        return 'There was an issue with your camera or microphone. You can continue with voice-only or try again.';
      
      case CallErrorType.AUTHENTICATION:
        return 'There was an authentication issue. Please try starting the call again.';
      
      case CallErrorType.MEETING:
        return 'The call session has ended or is no longer available.';
      
      case CallErrorType.FATAL:
        return 'There was a system error. Please restart the app and try again.';
      
      default:
        return 'An unexpected error occurred. Would you like to try again?';
    }
  }

  /**
   * Get user action options
   */
  private getUserActions(error: CallError): any[] {
    const actions = [];
    
    if (error.recoverable) {
      actions.push({
        text: 'Try Again',
        onPress: () => {
          appEventEmitter.emit('callErrorRetry', error);
        },
      });
      
      if (error.type === CallErrorType.MEDIA) {
        actions.push({
          text: 'Voice Only',
          onPress: () => {
            appEventEmitter.emit('callErrorSwitchToVoice', error);
          },
        });
      }
    }
    
    actions.push({
      text: 'End Call',
      style: 'destructive',
      onPress: () => {
        appEventEmitter.emit('callErrorEndCall', error);
      },
    });
    
    return actions;
  }

  /**
   * Log error for debugging
   */
  private logError(error: CallError): void {
    console.error('[CallErrorHandler] Call Error:', {
      type: error.type,
      code: error.code,
      message: error.message,
      callId: error.callId,
      timestamp: new Date(error.timestamp).toISOString(),
      recoverable: error.recoverable,
    });
  }

  /**
   * Add error to history
   */
  private addToHistory(error: CallError): void {
    this.errorHistory.unshift(error);
    
    // Limit history size
    if (this.errorHistory.length > this.MAX_HISTORY_SIZE) {
      this.errorHistory = this.errorHistory.slice(0, this.MAX_HISTORY_SIZE);
    }
    
    this.saveErrorHistory();
  }

  /**
   * Load error history from storage
   */
  private async loadErrorHistory(): Promise<void> {
    try {
      const historyJson = await AsyncStorage.getItem(this.ERROR_HISTORY_KEY);
      if (historyJson) {
        this.errorHistory = JSON.parse(historyJson);
      }
    } catch (error) {
      console.error('[CallErrorHandler] Failed to load error history:', error);
    }
  }

  /**
   * Save error history to storage
   */
  private async saveErrorHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ERROR_HISTORY_KEY, JSON.stringify(this.errorHistory));
    } catch (error) {
      console.error('[CallErrorHandler] Failed to save error history:', error);
    }
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: CallError[];
  } {
    const errorsByType = this.errorHistory.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      recentErrors: this.errorHistory.slice(0, 10),
    };
  }

  /**
   * Clear recovery attempts (call this on successful call connection)
   */
  public clearRecoveryAttempts(): void {
    this.recoveryAttempts.clear();
  }

  /**
   * Reset error handler state
   */
  public reset(): void {
    this.recoveryAttempts.clear();
    this.errorHistory = [];
    AsyncStorage.removeItem(this.ERROR_HISTORY_KEY);
  }
}

export default CallErrorHandler;
