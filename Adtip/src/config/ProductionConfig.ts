/**
 * Production Configuration
 * Disables problematic features in production builds to prevent crashes
 */
export class ProductionConfig {
  private static instance: ProductionConfig
  private isProduction = false

  private constructor() {
    this.detectProductionMode()
  }

  public static getInstance(): ProductionConfig {
    if (!ProductionConfig.instance) {
      ProductionConfig.instance = new ProductionConfig()
    }
    return ProductionConfig.instance
  }

  /**
   * Detect if we're in production mode
   */
  private detectProductionMode(): void {
    try {
      this.isProduction = !(__DEV__ as boolean)
      console.log('[ProductionConfig] Production mode detected:', this.isProduction)
    } catch (error) {
      // Default to production mode for safety
      this.isProduction = true
      console.warn('[ProductionConfig] Could not detect mode, defaulting to production')
    }
  }

  /**
   * Check if CallKeep should be disabled in production
   */
  isCallKeepDisabled(): boolean {
    if (!this.isProduction) {
      return false // Allow CallKeep in development
    }

    // In production, disable CallKeep to prevent crashes
    return true
  }

  /**
   * Check if native modules should be disabled in production
   */
  isNativeModulesDisabled(): boolean {
    if (!this.isProduction) {
      return false // Allow native modules in development
    }

    // In production, be more cautious with native modules
    return false // Keep native modules enabled but with error handling
  }

  /**
   * Get production-safe configuration
   */
  getConfig(): {
    isProduction: boolean
    callKeepEnabled: boolean
    nativeModulesEnabled: boolean
    errorHandlingEnabled: boolean
  } {
    return {
      isProduction: this.isProduction,
      callKeepEnabled: !this.isCallKeepDisabled(),
      nativeModulesEnabled: !this.isNativeModulesDisabled(),
      errorHandlingEnabled: this.isProduction
    }
  }

  /**
   * Get error handling configuration
   */
  getErrorHandlingConfig(): {
    maxRetries: number
    retryDelay: number
    shouldLogErrors: boolean
    shouldPreventCrashes: boolean
  } {
    return {
      maxRetries: this.isProduction ? 1 : 3,
      retryDelay: this.isProduction ? 1000 : 500,
      shouldLogErrors: true,
      shouldPreventCrashes: this.isProduction
    }
  }
} 