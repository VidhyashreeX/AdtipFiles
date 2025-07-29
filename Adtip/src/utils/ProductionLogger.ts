/**
 * Production-safe logging utility
 * Automatically disables console logs in production builds while maintaining development debugging
 */

interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

class ProductionLogger {
  private static instance: ProductionLogger;
  private isProduction: boolean;
  private enabledLevels: Set<string>;

  private constructor() {
    this.isProduction = !__DEV__;
    this.enabledLevels = new Set([
      LOG_LEVELS.ERROR, // Always log errors
      LOG_LEVELS.WARN,  // Always log warnings
    ]);

    // In development, enable all log levels
    if (__DEV__) {
      this.enabledLevels.add(LOG_LEVELS.INFO);
      this.enabledLevels.add(LOG_LEVELS.DEBUG);
    }
  }

  static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  /**
   * Debug logging - only in development
   */
  debug(tag: string, message: string, ...args: any[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(`[DEBUG:${tag}] ${message}`, ...args);
    }
  }

  /**
   * Info logging - only in development
   */
  info(tag: string, message: string, ...args: any[]): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.log(`[INFO:${tag}] ${message}`, ...args);
    }
  }

  /**
   * Warning logging - always enabled
   */
  warn(tag: string, message: string, ...args: any[]): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(`[WARN:${tag}] ${message}`, ...args);
    }
  }

  /**
   * Error logging - always enabled
   */
  error(tag: string, message: string, error?: any, ...args: any[]): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(`[ERROR:${tag}] ${message}`, error, ...args);
    }
  }

  /**
   * Performance logging - only in development with throttling
   */
  performance(tag: string, message: string, data?: any): void {
    if (__DEV__ && Math.random() < 0.1) { // Log only 10% of performance logs
      console.log(`[PERF:${tag}] ${message}`, data);
    }
  }

  /**
   * Network logging - only in development
   */
  network(tag: string, method: string, url: string, status?: number, data?: any): void {
    if (__DEV__) {
      console.log(`[NET:${tag}] ${method} ${url}`, status ? `(${status})` : '', data);
    }
  }

  /**
   * API logging - only in development
   */
  api(tag: string, endpoint: string, payload?: any, response?: any): void {
    if (__DEV__) {
      console.group(`[API:${tag}] ${endpoint}`);
      if (payload) console.log('Request:', payload);
      if (response) console.log('Response:', response);
      console.groupEnd();
    }
  }

  /**
   * Call-specific logging for video calling system
   */
  call(tag: string, message: string, data?: any): void {
    if (__DEV__) {
      console.log(`[CALL:${tag}] ${message}`, data);
    }
  }

  /**
   * VideoSDK-specific logging
   */
  videoSDK(tag: string, message: string, data?: any): void {
    if (__DEV__) {
      console.log(`[VideoSDK:${tag}] ${message}`, data);
    }
  }

  private shouldLog(level: string): boolean {
    return this.enabledLevels.has(level);
  }

  /**
   * Enable specific log level (useful for debugging production issues)
   */
  enableLevel(level: keyof LogLevel): void {
    this.enabledLevels.add(LOG_LEVELS[level]);
  }

  /**
   * Disable specific log level
   */
  disableLevel(level: keyof LogLevel): void {
    this.enabledLevels.delete(LOG_LEVELS[level]);
  }
}

// Export singleton instance
export const Logger = ProductionLogger.getInstance();

// Export convenience functions
export const logDebug = (tag: string, message: string, ...args: any[]) => 
  Logger.debug(tag, message, ...args);

export const logInfo = (tag: string, message: string, ...args: any[]) => 
  Logger.info(tag, message, ...args);

export const logWarn = (tag: string, message: string, ...args: any[]) => 
  Logger.warn(tag, message, ...args);

export const logError = (tag: string, message: string, error?: any, ...args: any[]) => 
  Logger.error(tag, message, error, ...args);

export const logPerformance = (tag: string, message: string, data?: any) => 
  Logger.performance(tag, message, data);

export const logNetwork = (tag: string, method: string, url: string, status?: number, data?: any) =>
  Logger.network(tag, method, url, status, data);

export const logApi = (tag: string, endpoint: string, payload?: any, response?: any) =>
  Logger.api(tag, endpoint, payload, response);

export const logCall = (tag: string, message: string, data?: any) =>
  Logger.call(tag, message, data);

export const logVideoSDK = (tag: string, message: string, data?: any) =>
  Logger.videoSDK(tag, message, data);

// Override global console in production
if (!__DEV__) {
  // Disable console.log, console.debug, console.info in production
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  
  // Keep console.warn and console.error for critical issues
  // console.warn and console.error remain unchanged
}

export default Logger;
