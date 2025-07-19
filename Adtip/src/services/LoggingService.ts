import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  tag: string;
  message: string;
  data?: unknown;
  stack?: string;
}

// Configuration interface
interface LoggingConfig {
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  enableRemoteLogging: boolean;
  minLogLevel: LogLevel;
  maxLogEntries: number;
  remoteEndpoint?: string;
}

class LoggingService {
  private config: LoggingConfig;
  private logBuffer: LogEntry[] = [];
  private readonly LOG_STORAGE_KEY = '@adtip_logs';
  private readonly MAX_BUFFER_SIZE = 1000;

  constructor() {
    // Default configuration
    this.config = {
      enableConsoleLogging: __DEV__, // Only in development
      enableFileLogging: true,
      enableRemoteLogging: false, // Can be enabled for crash reporting
      minLogLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.WARN,
      maxLogEntries: 500,
      remoteEndpoint: undefined,
    };

    // Initialize logging
    this.initialize();
  }

  /**
   * Initialize the logging service
   */
  private async initialize() {
    try {
      // Load existing logs from storage
      await this.loadLogsFromStorage();
      
      // Set up periodic log cleanup
      this.setupPeriodicCleanup();
      
      // Override console methods in production
      if (!__DEV__) {
        this.overrideConsoleMethods();
      }
    } catch (error) {
      // Fallback to console if initialization fails
      console.error('[LoggingService] Failed to initialize:', error);
    }
  }

  /**
   * Override console methods in production to prevent logging
   */
  private overrideConsoleMethods() {
    const originalConsole = { ...console };
    
    // Store original methods for internal use
    (this as any).originalConsole = originalConsole;
    
    // Override console methods
    console.log = (...args: any[]) => {
      this.debug('Console', args.join(' '));
    };
    
    console.info = (...args: any[]) => {
      this.info('Console', args.join(' '));
    };
    
    console.warn = (...args: any[]) => {
      this.warn('Console', args.join(' '));
    };
    
    console.error = (...args: any[]) => {
      this.error('Console', args.join(' '));
    };
    
    // Keep debug and trace for development tools
    console.debug = this.config.enableConsoleLogging ? originalConsole.debug : () => {};
    console.trace = this.config.enableConsoleLogging ? originalConsole.trace : () => {};
  }

  /**
   * Update logging configuration
   */
  updateConfig(newConfig: Partial<LoggingConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Log debug message
   */
  debug(tag: string, message: string, data?: unknown) {
    this.log(LogLevel.DEBUG, tag, message, data);
  }

  /**
   * Log info message
   */
  info(tag: string, message: string, data?: unknown) {
    this.log(LogLevel.INFO, tag, message, data);
  }

  /**
   * Log warning message
   */
  warn(tag: string, message: string, data?: unknown) {
    this.log(LogLevel.WARN, tag, message, data);
  }

  /**
   * Log error message
   */
  error(tag: string, message: string, error?: unknown) {
    let stack: string | undefined;
    let errorData: unknown = error;

    if (error instanceof Error) {
      stack = error.stack;
      errorData = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    this.log(LogLevel.ERROR, tag, message, errorData, stack);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, tag: string, message: string, data?: unknown, stack?: string) {
    // Check if logging is enabled for this level
    if (level < this.config.minLogLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      tag,
      message,
      data,
      stack,
    };

    // Console logging (development only)
    if (this.config.enableConsoleLogging) {
      this.logToConsole(logEntry);
    }

    // File logging
    if (this.config.enableFileLogging) {
      this.logToFile(logEntry);
    }

    // Remote logging (for crash reporting)
    if (this.config.enableRemoteLogging && level >= LogLevel.ERROR) {
      this.logToRemote(logEntry);
    }
  }

  /**
   * Log to console
   */
  private logToConsole(entry: LogEntry) {
    const levelName = LogLevel[entry.level];
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const logMessage = `[${timestamp}] ${levelName} [${entry.tag}] ${entry.message}`;

    // Use original console methods if available
    const originalConsole = (this as any).originalConsole || console;

    switch (entry.level) {
      case LogLevel.DEBUG:
        originalConsole.debug(logMessage, entry.data);
        break;
      case LogLevel.INFO:
        originalConsole.info(logMessage, entry.data);
        break;
      case LogLevel.WARN:
        originalConsole.warn(logMessage, entry.data);
        break;
      case LogLevel.ERROR:
        originalConsole.error(logMessage, entry.data);
        if (entry.stack) {
          originalConsole.error('Stack trace:', entry.stack);
        }
        break;
    }
  }

  /**
   * Log to file (AsyncStorage)
   */
  private logToFile(entry: LogEntry) {
    try {
      // Add to buffer
      this.logBuffer.push(entry);

      // Limit buffer size
      if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
        this.logBuffer = this.logBuffer.slice(-this.config.maxLogEntries);
      }

      // Periodically save to storage (debounced)
      this.debouncedSaveToStorage();
    } catch (error) {
      // Fallback to console if file logging fails
      console.error('[LoggingService] Failed to log to file:', error);
    }
  }

  /**
   * Log to remote service (for crash reporting)
   */
  private async logToRemote(entry: LogEntry) {
    if (!this.config.remoteEndpoint) {
      return;
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entry,
          platform: Platform.OS,
          version: Platform.Version,
          appVersion: '1.0.0', // Should come from app config
        }),
      });
    } catch (error) {
      // Don't log remote logging failures to avoid infinite loops
      console.error('[LoggingService] Failed to log to remote:', error);
    }
  }

  /**
   * Debounced save to storage
   */
  private saveTimeout: NodeJS.Timeout | null = null;
  private debouncedSaveToStorage() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveLogsToStorage();
    }, 1000); // Save after 1 second of inactivity
  }

  /**
   * Save logs to AsyncStorage
   */
  private async saveLogsToStorage() {
    try {
      const logsToSave = this.logBuffer.slice(-this.config.maxLogEntries);
      await AsyncStorage.setItem(this.LOG_STORAGE_KEY, JSON.stringify(logsToSave));
    } catch (error) {
      console.error('[LoggingService] Failed to save logs to storage:', error);
    }
  }

  /**
   * Load logs from AsyncStorage
   */
  private async loadLogsFromStorage() {
    try {
      const storedLogs = await AsyncStorage.getItem(this.LOG_STORAGE_KEY);
      if (storedLogs) {
        this.logBuffer = JSON.parse(storedLogs);
      }
    } catch (error) {
      console.error('[LoggingService] Failed to load logs from storage:', error);
      this.logBuffer = [];
    }
  }

  /**
   * Get all logs
   */
  async getLogs(): Promise<LogEntry[]> {
    await this.loadLogsFromStorage();
    return [...this.logBuffer];
  }

  /**
   * Clear all logs
   */
  async clearLogs() {
    this.logBuffer = [];
    try {
      await AsyncStorage.removeItem(this.LOG_STORAGE_KEY);
    } catch (error) {
      console.error('[LoggingService] Failed to clear logs:', error);
    }
  }

  /**
   * Export logs as string
   */
  async exportLogs(): Promise<string> {
    const logs = await this.getLogs();
    return logs
      .map(entry => {
        const levelName = LogLevel[entry.level];
        const timestamp = new Date(entry.timestamp).toLocaleString();
        let logLine = `[${timestamp}] ${levelName} [${entry.tag}] ${entry.message}`;
        
        if (entry.data) {
          logLine += `\nData: ${JSON.stringify(entry.data, null, 2)}`;
        }
        
        if (entry.stack) {
          logLine += `\nStack: ${entry.stack}`;
        }
        
        return logLine;
      })
      .join('\n\n');
  }

  /**
   * Setup periodic cleanup
   */
  private setupPeriodicCleanup() {
    // Clean up old logs every hour
    setInterval(() => {
      this.cleanupOldLogs();
    }, 60 * 60 * 1000);
  }

  /**
   * Clean up old logs
   */
  private cleanupOldLogs() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    this.logBuffer = this.logBuffer.filter(entry => {
      return new Date(entry.timestamp) > oneDayAgo;
    });

    // Save cleaned logs
    this.saveLogsToStorage();
  }
}

// Export singleton instance
export default new LoggingService();
