// Enhanced OTP Handler with Better Error States and Recovery
// File: src/services/EnhancedOtpHandler.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '../utils/ProductionLogger';
import ApiService from './ApiService';

export interface OtpState {
  mobileNumber: string;
  otpSent: boolean;
  otpVerified: boolean;
  attempts: number;
  maxAttempts: number;
  resendCount: number;
  maxResends: number;
  lastSentTime: number;
  expiryTime: number;
  cooldownUntil?: number;
  sessionId?: string;
  errorState?: OtpErrorState;
}

export interface OtpErrorState {
  type: 'NETWORK' | 'INVALID_OTP' | 'EXPIRED' | 'MAX_ATTEMPTS' | 'COOLDOWN' | 'SERVER_ERROR';
  message: string;
  retryable: boolean;
  retryAfter?: number;
}

export interface OtpConfig {
  otpLength: number;
  expiryMinutes: number;
  maxAttempts: number;
  maxResends: number;
  resendCooldownSeconds: number;
  attemptCooldownMinutes: number;
  autoRetryEnabled: boolean;
  networkRetryAttempts: number;
}

class EnhancedOtpHandler {
  private static instance: EnhancedOtpHandler;
  private otpState: OtpState | null = null;
  private retryTimer?: NodeJS.Timeout;
  private countdownTimer?: NodeJS.Timeout;
  
  private readonly STORAGE_KEY = '@enhanced_otp_state';
  
  private readonly DEFAULT_CONFIG: OtpConfig = {
    otpLength: 6,
    expiryMinutes: 10,
    maxAttempts: 3,
    maxResends: 3,
    resendCooldownSeconds: 30,
    attemptCooldownMinutes: 15,
    autoRetryEnabled: true,
    networkRetryAttempts: 3
  };

  private config: OtpConfig = this.DEFAULT_CONFIG;

  public static getInstance(): EnhancedOtpHandler {
    if (!EnhancedOtpHandler.instance) {
      EnhancedOtpHandler.instance = new EnhancedOtpHandler();
    }
    return EnhancedOtpHandler.instance;
  }

  private constructor() {
    this.loadStoredState();
  }

  // Initialize OTP session
  async initializeOtpSession(mobileNumber: string, config?: Partial<OtpConfig>): Promise<void> {
    try {
      if (config) {
        this.config = { ...this.DEFAULT_CONFIG, ...config };
      }

      // Check if there's an active cooldown
      const existingState = await this.getStoredState();
      if (existingState?.cooldownUntil && Date.now() < existingState.cooldownUntil) {
        throw this.createError('COOLDOWN', 
          `Please wait ${Math.ceil((existingState.cooldownUntil - Date.now()) / 60000)} minutes before trying again`,
          false,
          existingState.cooldownUntil - Date.now()
        );
      }

      this.otpState = {
        mobileNumber,
        otpSent: false,
        otpVerified: false,
        attempts: 0,
        maxAttempts: this.config.maxAttempts,
        resendCount: 0,
        maxResends: this.config.maxResends,
        lastSentTime: 0,
        expiryTime: 0,
        sessionId: this.generateSessionId()
      };

      await this.persistState();
      Logger.info('EnhancedOtpHandler', 'OTP session initialized for:', mobileNumber);
    } catch (error) {
      Logger.error('EnhancedOtpHandler', 'Failed to initialize OTP session:', error);
      throw error;
    }
  }

  // Send OTP with enhanced error handling
  async sendOtp(): Promise<{ success: boolean; message: string; retryAfter?: number }> {
    try {
      if (!this.otpState) {
        throw new Error('OTP session not initialized');
      }

      // Check resend cooldown
      const now = Date.now();
      if (this.otpState.lastSentTime > 0) {
        const timeSinceLastSend = now - this.otpState.lastSentTime;
        const cooldownTime = this.config.resendCooldownSeconds * 1000;
        
        if (timeSinceLastSend < cooldownTime) {
          const waitTime = Math.ceil((cooldownTime - timeSinceLastSend) / 1000);
          return {
            success: false,
            message: `Please wait ${waitTime} seconds before requesting another OTP`,
            retryAfter: waitTime
          };
        }
      }

      // Check resend limit
      if (this.otpState.resendCount >= this.config.maxResends) {
        await this.setCooldownPeriod();
        return {
          success: false,
          message: 'Maximum resend limit reached. Please try again later.',
          retryAfter: this.config.attemptCooldownMinutes * 60
        };
      }

      // Send OTP with retry logic
      const result = await this.sendOtpWithRetry();
      
      if (result.success) {
        this.otpState.otpSent = true;
        this.otpState.lastSentTime = now;
        this.otpState.expiryTime = now + (this.config.expiryMinutes * 60 * 1000);
        this.otpState.resendCount++;
        this.otpState.errorState = undefined;
        
        await this.persistState();
        this.startExpiryCountdown();
        
        Logger.info('EnhancedOtpHandler', 'OTP sent successfully');
      }

      return result;
    } catch (error) {
      Logger.error('EnhancedOtpHandler', 'Failed to send OTP:', error);
      await this.handleError(error);
      throw error;
    }
  }

  // Verify OTP with enhanced validation
  async verifyOtp(otp: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!this.otpState) {
        throw new Error('OTP session not initialized');
      }

      // Check if OTP is in cooldown
      if (this.otpState.cooldownUntil && Date.now() < this.otpState.cooldownUntil) {
        const waitTime = Math.ceil((this.otpState.cooldownUntil - Date.now()) / 60000);
        return {
          success: false,
          message: `Account temporarily locked. Please try again in ${waitTime} minutes.`
        };
      }

      // Validate OTP format
      if (!this.isValidOtpFormat(otp)) {
        this.otpState.attempts++;
        await this.handleFailedAttempt();
        return {
          success: false,
          message: 'Please enter a valid 6-digit OTP'
        };
      }

      // Check if OTP has expired
      if (Date.now() > this.otpState.expiryTime) {
        this.otpState.errorState = this.createError('EXPIRED', 'OTP has expired. Please request a new one.', true);
        await this.persistState();
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.'
        };
      }

      // Check attempt limit
      if (this.otpState.attempts >= this.config.maxAttempts) {
        await this.setCooldownPeriod();
        return {
          success: false,
          message: 'Too many failed attempts. Please try again later.'
        };
      }

      // Verify OTP with API
      const result = await this.verifyOtpWithApi(otp);
      
      if (result.success) {
        this.otpState.otpVerified = true;
        this.otpState.errorState = undefined;
        await this.persistState();
        this.clearTimers();
        
        Logger.info('EnhancedOtpHandler', 'OTP verified successfully');
        return result;
      } else {
        await this.handleFailedAttempt();
        return result;
      }
    } catch (error) {
      Logger.error('EnhancedOtpHandler', 'OTP verification failed:', error);
      await this.handleError(error);
      throw error;
    }
  }

  // Send OTP with retry logic
  private async sendOtpWithRetry(): Promise<{ success: boolean; message: string }> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.config.networkRetryAttempts; attempt++) {
      try {
        const response = await ApiService.post('/api/otplogin', {
          mobileNumber: this.otpState!.mobileNumber,
          userType: '2'
        });

        if (response.status === 200 && response.data) {
          return {
            success: true,
            message: 'OTP sent successfully'
          };
        } else {
          throw new Error(response.message || 'Failed to send OTP');
        }
      } catch (error) {
        lastError = error;
        Logger.warn('EnhancedOtpHandler', `OTP send attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.networkRetryAttempts) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // All attempts failed
    throw lastError;
  }

  // Verify OTP with API
  private async verifyOtpWithApi(otp: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await ApiService.verifyOtp({
        mobile_number: this.otpState!.mobileNumber,
        otp: otp,
        id: this.otpState!.sessionId || '1'
      });

      if ('data' in response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        return {
          success: true,
          message: 'OTP verified successfully',
          data: response.data[0]
        };
      } else if ('id' in response && response.id) {
        return {
          success: true,
          message: 'OTP verified successfully',
          data: response
        };
      } else {
        return {
          success: false,
          message: 'Invalid OTP. Please try again.'
        };
      }
    } catch (error: any) {
      Logger.error('EnhancedOtpHandler', 'API verification failed:', error);
      
      // Handle specific API errors
      if (error.response?.status === 400) {
        return {
          success: false,
          message: 'Invalid OTP. Please check and try again.'
        };
      } else if (error.response?.status === 429) {
        return {
          success: false,
          message: 'Too many requests. Please wait before trying again.'
        };
      } else {
        return {
          success: false,
          message: 'Network error. Please check your connection and try again.'
        };
      }
    }
  }

  // Handle failed OTP attempt
  private async handleFailedAttempt(): Promise<void> {
    if (!this.otpState) return;

    this.otpState.attempts++;
    
    if (this.otpState.attempts >= this.config.maxAttempts) {
      await this.setCooldownPeriod();
    } else {
      this.otpState.errorState = this.createError(
        'INVALID_OTP',
        `Invalid OTP. ${this.config.maxAttempts - this.otpState.attempts} attempts remaining.`,
        true
      );
    }

    await this.persistState();
  }

  // Set cooldown period after max attempts
  private async setCooldownPeriod(): Promise<void> {
    if (!this.otpState) return;

    const cooldownTime = this.config.attemptCooldownMinutes * 60 * 1000;
    this.otpState.cooldownUntil = Date.now() + cooldownTime;
    this.otpState.errorState = this.createError(
      'MAX_ATTEMPTS',
      `Too many failed attempts. Please try again in ${this.config.attemptCooldownMinutes} minutes.`,
      false,
      cooldownTime
    );

    await this.persistState();
    Logger.warn('EnhancedOtpHandler', 'Cooldown period set');
  }

  // Create error object
  private createError(type: OtpErrorState['type'], message: string, retryable: boolean, retryAfter?: number): OtpErrorState {
    return {
      type,
      message,
      retryable,
      retryAfter
    };
  }

  // Handle errors
  private async handleError(error: any): Promise<void> {
    if (!this.otpState) return;

    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      this.otpState.errorState = this.createError('NETWORK', 'Network error. Please check your connection.', true);
    } else if (error.response?.status >= 500) {
      this.otpState.errorState = this.createError('SERVER_ERROR', 'Server error. Please try again later.', true);
    } else {
      this.otpState.errorState = this.createError('SERVER_ERROR', error.message || 'An unexpected error occurred.', true);
    }

    await this.persistState();
  }

  // Validate OTP format
  private isValidOtpFormat(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }

  // Generate session ID
  private generateSessionId(): string {
    return `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start expiry countdown
  private startExpiryCountdown(): void {
    this.clearTimers();
    
    if (!this.otpState) return;

    const timeUntilExpiry = this.otpState.expiryTime - Date.now();
    
    this.countdownTimer = setTimeout(() => {
      if (this.otpState && !this.otpState.otpVerified) {
        this.otpState.errorState = this.createError('EXPIRED', 'OTP has expired. Please request a new one.', true);
        this.persistState();
        Logger.info('EnhancedOtpHandler', 'OTP expired');
      }
    }, timeUntilExpiry);
  }

  // Clear timers
  private clearTimers(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = undefined;
    }
  }

  // Storage methods
  private async persistState(): Promise<void> {
    try {
      if (this.otpState) {
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.otpState));
      }
    } catch (error) {
      Logger.error('EnhancedOtpHandler', 'Failed to persist OTP state:', error);
    }
  }

  private async loadStoredState(): Promise<void> {
    try {
      const storedState = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedState) {
        this.otpState = JSON.parse(storedState);
        // Check if stored state is still valid
        if (this.otpState && Date.now() > this.otpState.expiryTime && !this.otpState.otpVerified) {
          await this.clearState();
        }
      }
    } catch (error) {
      Logger.error('EnhancedOtpHandler', 'Failed to load stored OTP state:', error);
      await this.clearState();
    }
  }

  private async getStoredState(): Promise<OtpState | null> {
    try {
      const storedState = await AsyncStorage.getItem(this.STORAGE_KEY);
      return storedState ? JSON.parse(storedState) : null;
    } catch {
      return null;
    }
  }

  // Clear OTP state
  async clearState(): Promise<void> {
    try {
      this.otpState = null;
      this.clearTimers();
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      Logger.info('EnhancedOtpHandler', 'OTP state cleared');
    } catch (error) {
      Logger.error('EnhancedOtpHandler', 'Failed to clear OTP state:', error);
    }
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public getters
  getCurrentState(): OtpState | null {
    return this.otpState;
  }

  getTimeUntilExpiry(): number {
    if (!this.otpState || !this.otpState.otpSent) return 0;
    return Math.max(0, this.otpState.expiryTime - Date.now());
  }

  getTimeUntilResendAllowed(): number {
    if (!this.otpState || this.otpState.lastSentTime === 0) return 0;
    const cooldownTime = this.config.resendCooldownSeconds * 1000;
    const timeSinceLastSend = Date.now() - this.otpState.lastSentTime;
    return Math.max(0, cooldownTime - timeSinceLastSend);
  }

  canResend(): boolean {
    if (!this.otpState) return false;
    return this.getTimeUntilResendAllowed() === 0 && this.otpState.resendCount < this.config.maxResends;
  }

  getRemainingAttempts(): number {
    if (!this.otpState) return 0;
    return Math.max(0, this.config.maxAttempts - this.otpState.attempts);
  }

  isInCooldown(): boolean {
    if (!this.otpState?.cooldownUntil) return false;
    return Date.now() < this.otpState.cooldownUntil;
  }

  // Recovery methods
  async recoverFromNetworkError(): Promise<void> {
    if (this.otpState?.errorState?.type === 'NETWORK' && this.config.autoRetryEnabled) {
      Logger.info('EnhancedOtpHandler', 'Attempting recovery from network error');
      // Implement automatic recovery logic
    }
  }

  async resetSession(): Promise<void> {
    await this.clearState();
    Logger.info('EnhancedOtpHandler', 'OTP session reset');
  }
}

export default EnhancedOtpHandler;