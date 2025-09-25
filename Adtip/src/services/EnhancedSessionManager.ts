// Enhanced Session Management Service
// File: src/services/EnhancedSessionManager.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '../utils/ProductionLogger';

export interface SessionData {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  loginTime: number;
  lastActivity: number;
  deviceId: string;
  sessionExpiry?: number;
  isOtpVerified: boolean;
  biometricEnabled?: boolean;
}

export interface SessionConfig {
  sessionTimeout: number; // Session timeout in milliseconds
  refreshTokenExpiry: number; // Refresh token expiry in milliseconds
  activityTimeout: number; // Auto-logout after inactivity
  maxLoginAttempts: number;
  otpRetryLimit: number;
  otpTimeout: number;
}

class EnhancedSessionManager {
  private static instance: EnhancedSessionManager;
  private sessionData: SessionData | null = null;
  private sessionCheckInterval?: NodeJS.Timeout;
  private activityTimer?: NodeJS.Timeout;
  
  private readonly STORAGE_KEYS = {
    SESSION: '@enhanced_session',
    LOGIN_ATTEMPTS: '@login_attempts',
    OTP_ATTEMPTS: '@otp_attempts',
    BIOMETRIC_ENABLED: '@biometric_enabled',
    AUTO_LOGIN: '@auto_login_enabled',
    DEVICE_ID: '@device_id'
  };

  private readonly DEFAULT_CONFIG: SessionConfig = {
    sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    refreshTokenExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
    activityTimeout: 30 * 60 * 1000, // 30 minutes of inactivity
    maxLoginAttempts: 5,
    otpRetryLimit: 3,
    otpTimeout: 10 * 60 * 1000 // 10 minutes
  };

  private config: SessionConfig = this.DEFAULT_CONFIG;

  public static getInstance(): EnhancedSessionManager {
    if (!EnhancedSessionManager.instance) {
      EnhancedSessionManager.instance = new EnhancedSessionManager();
    }
    return EnhancedSessionManager.instance;
  }

  private constructor() {
    this.generateDeviceId();
    this.startSessionMonitoring();
  }

  // Initialize session manager
  async initialize(): Promise<void> {
    try {
      await this.loadStoredSession();
      await this.validateSession();
      Logger.info('EnhancedSessionManager', 'Session manager initialized');
    } catch (error) {
      Logger.error('EnhancedSessionManager', 'Initialization failed:', error);
      await this.clearSession();
    }
  }

  // Generate or retrieve device ID
  private async generateDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, deviceId);
      }
      return deviceId;
    } catch (error) {
      Logger.error('EnhancedSessionManager', 'Device ID generation failed:', error);
      return `fallback_${Date.now()}`;
    }
  }

  // Create new session
  async createSession(sessionData: Omit<SessionData, 'loginTime' | 'lastActivity' | 'deviceId'>): Promise<void> {
    try {
      const deviceId = await this.generateDeviceId();
      const now = Date.now();
      
      this.sessionData = {
        ...sessionData,
        loginTime: now,
        lastActivity: now,
        deviceId,
        sessionExpiry: now + this.config.sessionTimeout
      };

      await this.persistSession();
      await this.clearLoginAttempts();
      
      Logger.info('EnhancedSessionManager', 'Session created successfully');
    } catch (error) {
      Logger.error('EnhancedSessionManager', 'Session creation failed:', error);
      throw error;
    }
  }

  // Update session activity
  async updateActivity(): Promise<void> {
    if (this.sessionData) {
      this.sessionData.lastActivity = Date.now();
      await this.persistSession();
      this.resetActivityTimer();
    }
  }

  // Validate current session
  async validateSession(): Promise<boolean> {
    try {
      if (!this.sessionData) {
        return false;
      }

      const now = Date.now();

      // Check session expiry
      if (this.sessionData.sessionExpiry && now > this.sessionData.sessionExpiry) {
        Logger.warn('EnhancedSessionManager', 'Session expired');
        await this.clearSession();
        return false;
      }

      // Check activity timeout
      if (now - this.sessionData.lastActivity > this.config.activityTimeout) {
        Logger.warn('EnhancedSessionManager', 'Session inactive timeout');
        await this.handleInactiveSession();
        return false;
      }

      // Update activity if session is valid
      await this.updateActivity();
      return true;
    } catch (error) {
      Logger.error('EnhancedSessionManager', 'Session validation failed:', error);
      return false;
    }
  }

  // Handle inactive session
  private async handleInactiveSession(): Promise<void> {
    try {
      // Check if auto-login is enabled and user has biometric auth
      const biometricEnabled = await this.isBiometricEnabled();
      const autoLoginEnabled = await this.isAutoLoginEnabled();

      if (biometricEnabled && autoLoginEnabled) {
        Logger.info('EnhancedSessionManager', 'Attempting biometric re-authentication');
        // This would trigger biometric authentication in the UI layer
        return;
      }

      // Otherwise clear session
      await this.clearSession();
    } catch (error) {
      Logger.error('EnhancedSessionManager', 'Inactive session handling failed:', error);
      await this.clearSession();
    }
  }

  // Load stored session
  private async loadStoredSession(): Promise<void> {
    try {
      const storedSession = await AsyncStorage.getItem(this.STORAGE_KEYS.SESSION);
      if (storedSession) {
        this.sessionData = JSON.parse(storedSession);
        Logger.debug('EnhancedSessionManager', 'Session loaded from storage');
      }
    } catch (error) {
      Logger.error('EnhancedSessionManager', 'Failed to load stored session:', error);
      this.sessionData = null;
    }
  }

  // Persist session to storage
  private async persistSession(): Promise<void> {
    try {
      if (this.sessionData) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(this.sessionData));
      }
    } catch (error) {
      Logger.error('EnhancedSessionManager', 'Failed to persist session:', error);
      throw error;
    }
  }

  // Clear session
  async clearSession(): Promise<void> {
    try {
      this.sessionData = null;
      await AsyncStorage.removeItem(this.STORAGE_KEYS.SESSION);
      this.stopSessionMonitoring();
      Logger.info('EnhancedSessionManager', 'Session cleared');
    } catch (error) {
      Logger.error('EnhancedSessionManager', 'Failed to clear session:', error);
    }
  }

  // Login attempt tracking
  async trackLoginAttempt(success: boolean): Promise<void> {
    try {
      if (success) {
        await this.clearLoginAttempts();
        return;
      }

      const attempts = await this.getLoginAttempts();
      const newAttempts = attempts + 1;
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.LOGIN_ATTEMPTS, newAttempts.toString());
      
      if (newAttempts >= this.config.maxLoginAttempts) {
        Logger.warn('EnhancedSessionManager', 'Max login attempts reached');
        // Could trigger account lockout or cooldown period
      }
    } catch (error) {
      Logger.error('EnhancedSessionManager', 'Failed to track login attempt:', error);
    }
  }

  // OTP attempt tracking
  async trackOtpAttempt(success: boolean): Promise<void> {
    try {
      if (success) {
        await AsyncStorage.removeItem(this.STORAGE_KEYS.OTP_ATTEMPTS);
        return;
      }

      const attempts = await this.getOtpAttempts();
      const newAttempts = attempts + 1;
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.OTP_ATTEMPTS, newAttempts.toString());
      
      if (newAttempts >= this.config.otpRetryLimit) {
        Logger.warn('EnhancedSessionManager', 'Max OTP attempts reached');
        // Could trigger OTP cooldown or request new OTP
      }
    } catch (error) {
      Logger.error('EnhancedSessionManager', 'Failed to track OTP attempt:', error);
    }
  }

  // Start session monitoring
  private startSessionMonitoring(): void {
    this.sessionCheckInterval = setInterval(async () => {
      await this.validateSession();
    }, 60000); // Check every minute

    this.resetActivityTimer();
  }

  // Stop session monitoring
  private stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = undefined;
    }
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = undefined;
    }
  }

  // Reset activity timer
  private resetActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    
    this.activityTimer = setTimeout(async () => {
      Logger.info('EnhancedSessionManager', 'Activity timeout reached');
      await this.handleInactiveSession();
    }, this.config.activityTimeout);
  }

  // Getter methods
  getCurrentSession(): SessionData | null {
    return this.sessionData;
  }

  isSessionValid(): boolean {
    return this.sessionData !== null && this.sessionData.isOtpVerified;
  }

  getAccessToken(): string | null {
    return this.sessionData?.accessToken || null;
  }

  getUserId(): string | null {
    return this.sessionData?.userId || null;
  }

  async getLoginAttempts(): Promise<number> {
    try {
      const attempts = await AsyncStorage.getItem(this.STORAGE_KEYS.LOGIN_ATTEMPTS);
      return attempts ? parseInt(attempts, 10) : 0;
    } catch {
      return 0;
    }
  }

  async getOtpAttempts(): Promise<number> {
    try {
      const attempts = await AsyncStorage.getItem(this.STORAGE_KEYS.OTP_ATTEMPTS);
      return attempts ? parseInt(attempts, 10) : 0;
    } catch {
      return 0;
    }
  }

  private async clearLoginAttempts(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEYS.LOGIN_ATTEMPTS);
  }

  // Biometric authentication settings
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(this.STORAGE_KEYS.BIOMETRIC_ENABLED, enabled.toString());
  }

  async isBiometricEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(this.STORAGE_KEYS.BIOMETRIC_ENABLED);
    return enabled === 'true';
  }

  async setAutoLoginEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(this.STORAGE_KEYS.AUTO_LOGIN, enabled.toString());
  }

  async isAutoLoginEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(this.STORAGE_KEYS.AUTO_LOGIN);
    return enabled === 'true';
  }

  // Cleanup on app termination
  cleanup(): void {
    this.stopSessionMonitoring();
  }

  // Session recovery utilities
  async canRecoverSession(): Promise<boolean> {
    try {
      await this.loadStoredSession();
      return this.sessionData !== null && this.sessionData.accessToken !== '';
    } catch {
      return false;
    }
  }

  async extendSession(additionalTime: number = this.config.sessionTimeout): Promise<void> {
    if (this.sessionData) {
      this.sessionData.sessionExpiry = Date.now() + additionalTime;
      await this.persistSession();
      Logger.info('EnhancedSessionManager', 'Session extended');
    }
  }

  // Error recovery
  async handleNetworkError(): Promise<void> {
    // Implement network error recovery logic
    Logger.warn('EnhancedSessionManager', 'Network error detected - implementing recovery');
    // Could cache user actions, retry mechanisms, etc.
  }

  async handleAuthError(): Promise<void> {
    Logger.warn('EnhancedSessionManager', 'Authentication error - clearing session');
    await this.clearSession();
  }
}

export default EnhancedSessionManager;