/**
 * LogUtils - Utility for managing console logs in different environments
 * 
 * This utility provides a way to disable console.log statements in production
 * while keeping error and warning logs. It also provides a way to add prefixes
 * to logs for better organization.
 */

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Console wrapper that disables logs in production
 */
export const Logger = {
  /**
   * Log message (disabled in production)
   */
  log: (message?: any, ...optionalParams: any[]): void => {
    if (!isProduction) {
      console.log(message, ...optionalParams);
    }
  },

  /**
   * Warning message (always enabled)
   */
  warn: (message?: any, ...optionalParams: any[]): void => {
    console.warn(message, ...optionalParams);
  },

  /**
   * Error message (always enabled)
   */
  error: (message?: any, ...optionalParams: any[]): void => {
    console.error(message, ...optionalParams);
  },

  /**
   * Info message (disabled in production)
   */
  info: (message?: any, ...optionalParams: any[]): void => {
    if (!isProduction) {
      console.info(message, ...optionalParams);
    }
  },

  /**
   * Debug message (disabled in production)
   */
  debug: (message?: any, ...optionalParams: any[]): void => {
    if (!isProduction) {
      console.debug(message, ...optionalParams);
    }
  },

  /**
   * Create a namespaced logger
   */
  createLogger: (namespace: string) => {
    return {
      log: (message?: any, ...optionalParams: any[]): void => {
        if (!isProduction) {
          console.log(`[${namespace}]`, message, ...optionalParams);
        }
      },
      warn: (message?: any, ...optionalParams: any[]): void => {
        console.warn(`[${namespace}]`, message, ...optionalParams);
      },
      error: (message?: any, ...optionalParams: any[]): void => {
        console.error(`[${namespace}]`, message, ...optionalParams);
      },
      info: (message?: any, ...optionalParams: any[]): void => {
        if (!isProduction) {
          console.info(`[${namespace}]`, message, ...optionalParams);
        }
      },
      debug: (message?: any, ...optionalParams: any[]): void => {
        if (!isProduction) {
          console.debug(`[${namespace}]`, message, ...optionalParams);
        }
      }
    };
  }
};

export default Logger;
