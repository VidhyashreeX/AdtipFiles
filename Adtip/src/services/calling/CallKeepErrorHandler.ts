import { Platform } from 'react-native'
import { Logger } from '../../utils/ProductionLogger'

/**
 * CallKeep Error Handler for Production Builds
 * Prevents crashes and provides graceful degradation when CallKeep fails
 */
export class CallKeepErrorHandler {
  private static instance: CallKeepErrorHandler
  private isProduction = false
  private errorCount = 0
  private maxErrors = 3
  private lastErrorTime = 0
  private errorWindowMs = 60000 // 1 minute window

  private constructor() {
    this.detectProductionMode()
  }

  public static getInstance(): CallKeepErrorHandler {
    if (!CallKeepErrorHandler.instance) {
      CallKeepErrorHandler.instance = new CallKeepErrorHandler()
    }
    return CallKeepErrorHandler.instance
  }

  /**
   * Detect if we're in production mode
   */
  private detectProductionMode(): void {
    try {
      // Check if __DEV__ is false (production mode)
      this.isProduction = !(__DEV__ as boolean)
      console.log('[CallKeepErrorHandler] Production mode detected:', this.isProduction)
    } catch (error) {
      // Default to production mode for safety
      this.isProduction = true
      console.warn('[CallKeepErrorHandler] Could not detect mode, defaulting to production')
    }
  }

  /**
   * Handle CallKeep initialization errors
   */
  handleInitializationError(error: any, context: string = 'CallKeep'): boolean {
    const errorMessage = this.formatError(error)
    
    Logger.error('CallKeepErrorHandler', `${context} initialization error:`, {
      error: errorMessage,
      isProduction: this.isProduction,
      errorCount: this.errorCount
    })

    if (this.shouldDisableCallKeep()) {
      Logger.warn('CallKeepErrorHandler', 'Disabling CallKeep due to repeated errors')
      return false
    }

    return true
  }

  /**
   * Handle CallKeep method call errors
   */
  handleMethodError(error: any, methodName: string, context: string = 'CallKeep'): boolean {
    const errorMessage = this.formatError(error)
    
    Logger.error('CallKeepErrorHandler', `${context} method error (${methodName}):`, {
      error: errorMessage,
      method: methodName,
      isProduction: this.isProduction,
      errorCount: this.errorCount
    })

    // In production, don't throw errors - just log and continue
    if (this.isProduction) {
      console.warn(`[CallKeepErrorHandler] 🚫 CallKeep method ${methodName} failed in production, continuing without CallKeep`)
      return false
    }

    // In development, allow errors to propagate for debugging
    return true
  }

  /**
   * Handle native module errors (like the RNCallKeep duplicate method error)
   */
  handleNativeModuleError(error: any): boolean {
    const errorMessage = this.formatError(error)
    
    Logger.error('CallKeepErrorHandler', 'Native module error detected:', {
      error: errorMessage,
      isProduction: this.isProduction
    })

    // Check if this is the specific duplicate method error
    if (errorMessage.includes('displayIncomingCall') && errorMessage.includes('same name')) {
      Logger.warn('CallKeepErrorHandler', '🚫 Detected duplicate displayIncomingCall method error')
      
      if (this.isProduction) {
        console.warn('[CallKeepErrorHandler] 🚫 CallKeep disabled due to native module conflict')
        return false
      }
    }

    // For other native errors, disable CallKeep in production
    if (this.isProduction) {
      console.warn('[CallKeepErrorHandler] 🚫 CallKeep disabled due to native module error')
      return false
    }

    return true
  }

  /**
   * Check if CallKeep should be disabled due to repeated errors
   */
  private shouldDisableCallKeep(): boolean {
    const now = Date.now()
    
    // Reset error count if outside error window
    if (now - this.lastErrorTime > this.errorWindowMs) {
      this.errorCount = 0
    }
    
    this.errorCount++
    this.lastErrorTime = now
    
    return this.errorCount >= this.maxErrors
  }

  /**
   * Format error message for logging
   */
  private formatError(error: any): string {
    if (typeof error === 'string') {
      return error
    }
    
    if (error?.message) {
      return error.message
    }
    
    if (error?.toString) {
      return error.toString()
    }
    
    return 'Unknown error'
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { errorCount: number; isProduction: boolean; lastErrorTime: number } {
    return {
      errorCount: this.errorCount,
      isProduction: this.isProduction,
      lastErrorTime: this.lastErrorTime
    }
  }

  /**
   * Reset error count (useful for testing)
   */
  resetErrorCount(): void {
    this.errorCount = 0
    this.lastErrorTime = 0
  }
} 