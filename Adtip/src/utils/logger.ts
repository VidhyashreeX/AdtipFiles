import LoggingService from '../services/LoggingService';

/**
 * Simple logger utility that wraps the LoggingService
 * Use this instead of console.log throughout the app
 */
class Logger {
  /**
   * Log debug message
   * Use for detailed debugging information
   */
  static debug(tag: string, message: string, data?: unknown) {
    LoggingService.debug(tag, message, data);
  }

  /**
   * Log info message
   * Use for general information
   */
  static info(tag: string, message: string, data?: unknown) {
    LoggingService.info(tag, message, data);
  }

  /**
   * Log warning message
   * Use for potential issues that don't break functionality
   */
  static warn(tag: string, message: string, data?: unknown) {
    LoggingService.warn(tag, message, data);
  }

  /**
   * Log error message
   * Use for errors and exceptions
   */
  static error(tag: string, message: string, error?: unknown) {
    LoggingService.error(tag, message, error);
  }

  /**
   * Create a tagged logger for a specific component/service
   * This helps organize logs by component
   */
  static createTaggedLogger(defaultTag: string) {
    return {
      debug: (message: string, data?: unknown) => Logger.debug(defaultTag, message, data),
      info: (message: string, data?: unknown) => Logger.info(defaultTag, message, data),
      warn: (message: string, data?: unknown) => Logger.warn(defaultTag, message, data),
      error: (message: string, error?: unknown) => Logger.error(defaultTag, message, error),
    };
  }

  /**
   * Get all logs (for debugging/support)
   */
  static async getLogs() {
    return LoggingService.getLogs();
  }

  /**
   * Clear all logs
   */
  static async clearLogs() {
    return LoggingService.clearLogs();
  }

  /**
   * Export logs as string (for sharing with support)
   */
  static async exportLogs() {
    return LoggingService.exportLogs();
  }
}

export default Logger;

// Export tagged loggers for common components
export const AuthLogger = Logger.createTaggedLogger('Auth');
export const ApiLogger = Logger.createTaggedLogger('API');
export const VideoLogger = Logger.createTaggedLogger('Video');
export const UploadLogger = Logger.createTaggedLogger('Upload');
export const PaymentLogger = Logger.createTaggedLogger('Payment');
export const NavigationLogger = Logger.createTaggedLogger('Navigation');
export const TipShortsLogger = Logger.createTaggedLogger('TipShorts');
export const TipTubeLogger = Logger.createTaggedLogger('TipTube');
export const ChannelLogger = Logger.createTaggedLogger('Channel');
export const CampaignLogger = Logger.createTaggedLogger('Campaign');

// Example usage:
// import Logger, { AuthLogger } from '../utils/logger';
//
// // Generic logging
// Logger.info('MyComponent', 'User logged in', { userId: 123 });
//
// // Tagged logging
// AuthLogger.info('User logged in', { userId: 123 });
// ApiLogger.error('API call failed', error);
// VideoLogger.debug('Video started playing', { videoId: 'abc123' });
