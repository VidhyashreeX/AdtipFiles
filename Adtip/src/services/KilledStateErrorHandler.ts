import { Platform, AppState } from 'react-native';
import { Logger } from '../utils/ProductionLogger';

/**
 * Error types for killed state scenarios
 */
export enum KilledStateErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  SERVICE_INIT_ERROR = 'SERVICE_INIT_ERROR',
  RESOURCE_CONSTRAINT = 'RESOURCE_CONSTRAINT',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error context information
 */
export interface ErrorContext {
  sessionId: string;
  serviceName?: string;
  operation: string;
  timestamp: number;
  platform: string;
  appState: string;
  memoryUsage?: number;
  networkType?: string;
  batteryLevel?: number;
}

/**
 * Recovery strategy for different error types
 */
export interface RecoveryStrategy {
  retryCount: number;
  retryDelay: number;
  fallbackAction?: () => Promise<boolean>;
  userNotification?: string;
  escalateAfterRetries: boolean;
}

/**
 * Comprehensive error handler for killed state scenarios
 * Provides robust error handling and recovery mechanisms
 */
export class KilledStateErrorHandler {
  private static _instance: KilledStateErrorHandler;
  private errorHistory: Map<string, number> = new Map(); // Track error frequencies
  private recoveryStrategies: Map<KilledStateErrorType, RecoveryStrategy> = new Map();
  private maxRetryAttempts = 3;
  private retryDelayBase = 1000; // 1 second base delay

  private constructor() {
    this.initializeRecoveryStrategies();
    Logger.info('KilledStateErrorHandler', 'Error handler initialized');
  }

  public static getInstance(): KilledStateErrorHandler {
    if (!KilledStateErrorHandler._instance) {
      KilledStateErrorHandler._instance = new KilledStateErrorHandler();
    }
    return KilledStateErrorHandler._instance;
  }

  /**
   * Initialize recovery strategies for different error types
   */
  private initializeRecoveryStrategies(): void {
    this.recoveryStrategies.set(KilledStateErrorType.NETWORK_ERROR, {
      retryCount: 3,
      retryDelay: 2000,
      userNotification: 'Network connection issue. Retrying...',
      escalateAfterRetries: true,
    });

    this.recoveryStrategies.set(KilledStateErrorType.PERMISSION_ERROR, {
      retryCount: 1,
      retryDelay: 1000,
      userNotification: 'Permission required. Please check app settings.',
      escalateAfterRetries: true,
    });

    this.recoveryStrategies.set(KilledStateErrorType.SERVICE_INIT_ERROR, {
      retryCount: 2,
      retryDelay: 3000,
      userNotification: 'Service initialization failed. Retrying...',
      escalateAfterRetries: true,
    });

    this.recoveryStrategies.set(KilledStateErrorType.RESOURCE_CONSTRAINT, {
      retryCount: 1,
      retryDelay: 5000,
      userNotification: 'Device resources limited. Please close other apps.',
      escalateAfterRetries: false,
    });

    this.recoveryStrategies.set(KilledStateErrorType.TIMEOUT_ERROR, {
      retryCount: 2,
      retryDelay: 1500,
      userNotification: 'Operation timed out. Retrying...',
      escalateAfterRetries: true,
    });

    this.recoveryStrategies.set(KilledStateErrorType.UNKNOWN_ERROR, {
      retryCount: 1,
      retryDelay: 2000,
      userNotification: 'Unexpected error occurred. Retrying...',
      escalateAfterRetries: true,
    });
  }

  /**
   * Handle error with automatic recovery
   */
  public async handleError(
    error: Error,
    context: ErrorContext,
    retryFunction?: () => Promise<boolean>
  ): Promise<boolean> {
    const errorType = this.classifyError(error);
    const errorKey = `${errorType}_${context.serviceName || context.operation}`;
    
    // Track error frequency
    const currentCount = this.errorHistory.get(errorKey) || 0;
    this.errorHistory.set(errorKey, currentCount + 1);

    Logger.error('KilledStateErrorHandler', '❌ Handling killed state error', {
      errorType,
      error: error.message,
      context,
      errorCount: currentCount + 1,
    });

    // Get recovery strategy
    const strategy = this.recoveryStrategies.get(errorType);
    if (!strategy) {
      Logger.error('KilledStateErrorHandler', 'No recovery strategy found for error type', { errorType });
      return false;
    }

    // Check if we should attempt recovery
    if (currentCount >= strategy.retryCount) {
      Logger.warn('KilledStateErrorHandler', 'Max retry attempts reached', {
        errorType,
        attempts: currentCount,
        maxRetries: strategy.retryCount,
      });

      if (strategy.escalateAfterRetries) {
        return this.escalateError(error, context, errorType);
      }
      
      return false;
    }

    // Attempt recovery
    return this.attemptRecovery(error, context, errorType, strategy, retryFunction);
  }

  /**
   * Classify error type based on error message and context
   */
  private classifyError(error: Error): KilledStateErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
      return KilledStateErrorType.NETWORK_ERROR;
    }

    if (message.includes('permission') || message.includes('denied') || message.includes('unauthorized')) {
      return KilledStateErrorType.PERMISSION_ERROR;
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return KilledStateErrorType.TIMEOUT_ERROR;
    }

    if (message.includes('memory') || message.includes('resource') || message.includes('limit')) {
      return KilledStateErrorType.RESOURCE_CONSTRAINT;
    }

    if (message.includes('initialization') || message.includes('init') || message.includes('setup')) {
      return KilledStateErrorType.SERVICE_INIT_ERROR;
    }

    return KilledStateErrorType.UNKNOWN_ERROR;
  }

  /**
   * Attempt recovery using the specified strategy
   */
  private async attemptRecovery(
    error: Error,
    context: ErrorContext,
    errorType: KilledStateErrorType,
    strategy: RecoveryStrategy,
    retryFunction?: () => Promise<boolean>
  ): Promise<boolean> {
    Logger.info('KilledStateErrorHandler', '🔄 Attempting error recovery', {
      errorType,
      retryDelay: strategy.retryDelay,
      hasRetryFunction: !!retryFunction,
    });

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, strategy.retryDelay));

    try {
      // Try specific recovery actions based on error type
      const recoverySuccess = await this.executeRecoveryAction(errorType, context);
      
      if (!recoverySuccess && !retryFunction) {
        Logger.warn('KilledStateErrorHandler', 'Recovery action failed and no retry function provided');
        return false;
      }

      // Execute retry function if provided
      if (retryFunction) {
        const retrySuccess = await retryFunction();
        if (retrySuccess) {
          Logger.info('KilledStateErrorHandler', '✅ Error recovery successful', { errorType });
          // Reset error count on successful recovery
          const errorKey = `${errorType}_${context.serviceName || context.operation}`;
          this.errorHistory.delete(errorKey);
          return true;
        }
      }

      return recoverySuccess;

    } catch (recoveryError) {
      Logger.error('KilledStateErrorHandler', '❌ Recovery attempt failed', {
        errorType,
        recoveryError: recoveryError instanceof Error ? recoveryError.message : String(recoveryError),
      });
      return false;
    }
  }

  /**
   * Execute specific recovery actions based on error type
   */
  private async executeRecoveryAction(errorType: KilledStateErrorType, context: ErrorContext): Promise<boolean> {
    switch (errorType) {
      case KilledStateErrorType.NETWORK_ERROR:
        return this.handleNetworkError(context);

      case KilledStateErrorType.PERMISSION_ERROR:
        return this.handlePermissionError(context);

      case KilledStateErrorType.SERVICE_INIT_ERROR:
        return this.handleServiceInitError(context);

      case KilledStateErrorType.RESOURCE_CONSTRAINT:
        return this.handleResourceConstraint(context);

      case KilledStateErrorType.TIMEOUT_ERROR:
        return this.handleTimeoutError(context);

      default:
        return this.handleUnknownError(context);
    }
  }

  /**
   * Handle network-related errors
   */
  private async handleNetworkError(context: ErrorContext): Promise<boolean> {
    Logger.info('KilledStateErrorHandler', '🌐 Handling network error');
    
    // Wait for network connectivity
    // TODO: Implement network connectivity check
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return true; // Assume network is available after delay
  }

  /**
   * Handle permission-related errors
   */
  private async handlePermissionError(context: ErrorContext): Promise<boolean> {
    Logger.info('KilledStateErrorHandler', '🔐 Handling permission error');
    
    // TODO: Implement permission request logic
    // For now, just log and return false
    Logger.warn('KilledStateErrorHandler', 'Permission error requires user intervention');
    return false;
  }

  /**
   * Handle service initialization errors
   */
  private async handleServiceInitError(context: ErrorContext): Promise<boolean> {
    Logger.info('KilledStateErrorHandler', '⚙️ Handling service initialization error');
    
    // Clear any cached service states
    if (context.serviceName === 'videoSDK') {
      // TODO: Reset VideoSDK service state
    } else if (context.serviceName === 'firebase') {
      // TODO: Reset Firebase service state
    }
    
    return true;
  }

  /**
   * Handle resource constraint errors
   */
  private async handleResourceConstraint(context: ErrorContext): Promise<boolean> {
    Logger.info('KilledStateErrorHandler', '💾 Handling resource constraint');
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Add longer delay for resource recovery
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return true;
  }

  /**
   * Handle timeout errors
   */
  private async handleTimeoutError(context: ErrorContext): Promise<boolean> {
    Logger.info('KilledStateErrorHandler', '⏰ Handling timeout error');
    
    // Shorter delay for timeout recovery
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }

  /**
   * Handle unknown errors
   */
  private async handleUnknownError(context: ErrorContext): Promise<boolean> {
    Logger.info('KilledStateErrorHandler', '❓ Handling unknown error');
    
    // Generic recovery delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return true;
  }

  /**
   * Escalate error when recovery fails
   */
  private async escalateError(error: Error, context: ErrorContext, errorType: KilledStateErrorType): Promise<boolean> {
    Logger.error('KilledStateErrorHandler', '🚨 Escalating error after failed recovery', {
      errorType,
      error: error.message,
      context,
    });

    // TODO: Send error to crash reporting service
    // TODO: Show user-friendly error message
    // TODO: Implement fallback UI

    // For now, attempt one final fallback
    return this.executeFinalFallback(context);
  }

  /**
   * Execute final fallback when all recovery attempts fail
   */
  private async executeFinalFallback(context: ErrorContext): Promise<boolean> {
    Logger.info('KilledStateErrorHandler', '🆘 Executing final fallback');
    
    try {
      // Try to display a basic notification as last resort
      const { default: NotifeeCallHandler } = await import('./notification/NotifeeCallHandler');
      const handler = NotifeeCallHandler.getInstance();
      
      if (!handler.isReady) {
        await handler.initialize();
      }
      
      await handler.displayIncomingCall({
        sessionId: context.sessionId,
        callerName: 'Unknown Caller',
        callType: 'voice',
        meetingId: `fallback-${Date.now()}`,
        token: `fallback-token-${Date.now()}`
      });
      
      Logger.info('KilledStateErrorHandler', '✅ Final fallback notification displayed');
      return true;
      
    } catch (fallbackError) {
      Logger.error('KilledStateErrorHandler', '❌ Final fallback also failed', { fallbackError });
      return false;
    }
  }

  /**
   * Get error statistics for monitoring
   */
  public getErrorStatistics(): Record<string, number> {
    return Object.fromEntries(this.errorHistory);
  }

  /**
   * Clear error history
   */
  public clearErrorHistory(): void {
    this.errorHistory.clear();
    Logger.info('KilledStateErrorHandler', 'Error history cleared');
  }

  /**
   * Create error context from current app state
   */
  public createErrorContext(sessionId: string, serviceName?: string, operation?: string): ErrorContext {
    return {
      sessionId,
      serviceName,
      operation: operation || 'unknown',
      timestamp: Date.now(),
      platform: Platform.OS,
      appState: AppState.currentState,
      // TODO: Add memory usage, network type, battery level
    };
  }
}

export default KilledStateErrorHandler;
