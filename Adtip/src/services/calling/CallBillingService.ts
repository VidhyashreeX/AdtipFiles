/**
 * CallBillingService - Manages call billing and automatic termination
 * 
 * This service handles:
 * - Calculating maximum call duration based on wallet balance and user type
 * - Tracking call time and billing
 * - Automatically ending calls when balance is exhausted
 * - Providing warnings before call termination
 */

import { appEventEmitter } from '../../events/AppEventEmitter';
import WalletService from '../WalletService';

export interface CallRates {
  voiceNonPremium: number; // ₹7 per minute
  voicePremium: number;    // ₹4 per minute
  videoNonPremium: number; // ₹14 per minute
  videoPremium: number;    // ₹7 per minute
}

export interface CallBillingInfo {
  maxDurationSeconds: number;
  ratePerMinute: number;
  warningThresholds: number[]; // Seconds before end when to show warnings
  currentCost: number;
  remainingBalance: number;
}

class CallBillingService {
  private static instance: CallBillingService;
  
  // Call rates in rupees per minute
  private readonly CALL_RATES: CallRates = {
    voiceNonPremium: 7,
    voicePremium: 4,
    videoNonPremium: 14,
    videoPremium: 7,
  };

  // Warning thresholds in seconds before call ends
  private readonly WARNING_THRESHOLDS = [300, 120, 60, 30, 10]; // 5 min, 2 min, 1 min, 30s, 10s

  // Current call billing state
  private currentCallId: string | null = null;
  private callStartTime: number | null = null;
  private maxDurationSeconds: number = 0;
  private ratePerMinute: number = 0;
  private billingTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private callType: 'voice' | 'video' | null = null;
  private isPremium: boolean = false;
  private initialBalance: number = 0;
  private warningsShown: Set<number> = new Set();

  private constructor() {}

  public static getInstance(): CallBillingService {
    if (!CallBillingService.instance) {
      CallBillingService.instance = new CallBillingService();
    }
    return CallBillingService.instance;
  }

  /**
   * Calculate call billing information based on user type, call type, and balance
   */
  public async calculateCallBilling(
    userId: string,
    callType: 'voice' | 'video',
    currentBalance: number,
    isPremium: boolean
  ): Promise<CallBillingInfo> {
    console.log('[CallBillingService] Calculating billing for:', {
      userId,
      callType,
      currentBalance,
      isPremium
    });

    // Determine rate per minute
    let ratePerMinute: number;
    if (callType === 'voice') {
      ratePerMinute = isPremium ? this.CALL_RATES.voicePremium : this.CALL_RATES.voiceNonPremium;
    } else {
      ratePerMinute = isPremium ? this.CALL_RATES.videoPremium : this.CALL_RATES.videoNonPremium;
    }

    // Calculate maximum duration in seconds
    const maxMinutes = Math.floor(currentBalance / ratePerMinute);
    const maxDurationSeconds = maxMinutes * 60;

    // Calculate warning thresholds (only include those that are less than max duration)
    const warningThresholds = this.WARNING_THRESHOLDS.filter(
      threshold => threshold < maxDurationSeconds
    );

    console.log('[CallBillingService] Calculated billing:', {
      ratePerMinute,
      maxMinutes,
      maxDurationSeconds,
      warningThresholds
    });

    return {
      maxDurationSeconds,
      ratePerMinute,
      warningThresholds,
      currentCost: 0,
      remainingBalance: currentBalance,
    };
  }

  /**
   * Start billing for a call
   */
  public async startCallBilling(
    callId: string,
    userId: string,
    callType: 'voice' | 'video',
    currentBalance: number,
    isPremium: boolean
  ): Promise<void> {
    console.log('[CallBillingService] Starting call billing for:', callId);

    // Stop any existing billing
    this.stopCallBilling();

    // Store call information
    this.currentCallId = callId;
    this.userId = userId;
    this.callType = callType;
    this.isPremium = isPremium;
    this.initialBalance = currentBalance;
    this.callStartTime = Date.now();
    this.warningsShown.clear();

    // Calculate billing info
    const billingInfo = await this.calculateCallBilling(userId, callType, currentBalance, isPremium);
    this.maxDurationSeconds = billingInfo.maxDurationSeconds;
    this.ratePerMinute = billingInfo.ratePerMinute;

    console.log('[CallBillingService] Call can last maximum:', this.maxDurationSeconds, 'seconds');

    // Check if user has sufficient balance for at least 1 minute
    if (this.maxDurationSeconds < 60) {
      console.warn('[CallBillingService] Insufficient balance for minimum call duration');
      appEventEmitter.emit('callBillingWarning', {
        type: 'insufficient_balance',
        message: 'Insufficient balance for call. Call will end soon.',
        remainingSeconds: this.maxDurationSeconds,
      });
    }

    // Start billing timer (updates every second)
    this.startBillingTimer();

    // Start warning timer
    this.startWarningTimer();

    // Emit billing started event
    appEventEmitter.emit('callBillingStarted', {
      callId,
      maxDurationSeconds: this.maxDurationSeconds,
      ratePerMinute: this.ratePerMinute,
    });
  }

  /**
   * Stop billing for current call
   */
  public stopCallBilling(): void {
    console.log('[CallBillingService] Stopping call billing');

    // Clear timers
    if (this.billingTimer) {
      clearInterval(this.billingTimer);
      this.billingTimer = null;
    }

    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    // Calculate final cost if call was active
    if (this.currentCallId && this.callStartTime) {
      const callDurationSeconds = Math.floor((Date.now() - this.callStartTime) / 1000);
      const callDurationMinutes = Math.ceil(callDurationSeconds / 60); // Round up for billing
      const finalCost = callDurationMinutes * this.ratePerMinute;

      console.log('[CallBillingService] Final call cost:', {
        durationSeconds: callDurationSeconds,
        durationMinutes: callDurationMinutes,
        cost: finalCost,
      });

      // Emit billing ended event
      appEventEmitter.emit('callBillingEnded', {
        callId: this.currentCallId,
        durationSeconds: callDurationSeconds,
        durationMinutes: callDurationMinutes,
        cost: finalCost,
        ratePerMinute: this.ratePerMinute,
      });
    }

    // Reset state
    this.currentCallId = null;
    this.callStartTime = null;
    this.maxDurationSeconds = 0;
    this.ratePerMinute = 0;
    this.userId = null;
    this.callType = null;
    this.isPremium = false;
    this.initialBalance = 0;
    this.warningsShown.clear();
  }

  /**
   * Get current call billing status
   */
  public getCurrentBillingStatus(): {
    isActive: boolean;
    callId: string | null;
    elapsedSeconds: number;
    remainingSeconds: number;
    currentCost: number;
    ratePerMinute: number;
  } {
    const isActive = this.currentCallId !== null && this.callStartTime !== null;
    
    if (!isActive) {
      return {
        isActive: false,
        callId: null,
        elapsedSeconds: 0,
        remainingSeconds: 0,
        currentCost: 0,
        ratePerMinute: 0,
      };
    }

    const elapsedSeconds = Math.floor((Date.now() - this.callStartTime!) / 1000);
    const remainingSeconds = Math.max(0, this.maxDurationSeconds - elapsedSeconds);
    const elapsedMinutes = Math.ceil(elapsedSeconds / 60);
    const currentCost = elapsedMinutes * this.ratePerMinute;

    return {
      isActive,
      callId: this.currentCallId,
      elapsedSeconds,
      remainingSeconds,
      currentCost,
      ratePerMinute: this.ratePerMinute,
    };
  }

  /**
   * Start the billing timer that tracks call duration and costs
   */
  private startBillingTimer(): void {
    this.billingTimer = setInterval(() => {
      if (!this.currentCallId || !this.callStartTime) {
        return;
      }

      const elapsedSeconds = Math.floor((Date.now() - this.callStartTime) / 1000);
      const remainingSeconds = Math.max(0, this.maxDurationSeconds - elapsedSeconds);

      // Check if call should be terminated
      if (remainingSeconds <= 0) {
        console.log('[CallBillingService] Call time limit reached, ending call');
        this.endCallDueToInsufficientBalance();
        return;
      }

      // Emit billing update
      const elapsedMinutes = Math.ceil(elapsedSeconds / 60);
      const currentCost = elapsedMinutes * this.ratePerMinute;

      appEventEmitter.emit('callBillingUpdate', {
        callId: this.currentCallId,
        elapsedSeconds,
        remainingSeconds,
        currentCost,
        ratePerMinute: this.ratePerMinute,
      });
    }, 1000); // Update every second
  }

  /**
   * Start warning timer to show warnings before call ends
   */
  private startWarningTimer(): void {
    const scheduleNextWarning = () => {
      if (!this.currentCallId || !this.callStartTime) {
        return;
      }

      const elapsedSeconds = Math.floor((Date.now() - this.callStartTime) / 1000);
      const remainingSeconds = Math.max(0, this.maxDurationSeconds - elapsedSeconds);

      // Find the next warning threshold to show
      const nextWarning = this.WARNING_THRESHOLDS.find(
        threshold => threshold <= remainingSeconds && !this.warningsShown.has(threshold)
      );

      if (nextWarning) {
        const timeToWarning = remainingSeconds - nextWarning;
        
        this.warningTimer = setTimeout(() => {
          this.showTimeWarning(nextWarning);
          this.warningsShown.add(nextWarning);
          scheduleNextWarning(); // Schedule next warning
        }, timeToWarning * 1000);
      }
    };

    scheduleNextWarning();
  }

  /**
   * Show time warning to user
   */
  private showTimeWarning(remainingSeconds: number): void {
    console.log('[CallBillingService] Showing time warning:', remainingSeconds, 'seconds remaining');

    let message: string;
    if (remainingSeconds >= 60) {
      const minutes = Math.floor(remainingSeconds / 60);
      message = `Call will end in ${minutes} minute${minutes > 1 ? 's' : ''} due to low balance`;
    } else {
      message = `Call will end in ${remainingSeconds} seconds due to low balance`;
    }

    appEventEmitter.emit('callBillingWarning', {
      type: 'time_warning',
      message,
      remainingSeconds,
    });
  }

  /**
   * End call due to insufficient balance
   */
  private async endCallDueToInsufficientBalance(): Promise<void> {
    console.log('[CallBillingService] Ending call due to insufficient balance');

    // Stop billing first
    this.stopCallBilling();

    // Emit event to end the call
    appEventEmitter.emit('callEndDueToBalance', {
      reason: 'insufficient_balance',
      message: 'Call ended due to insufficient wallet balance',
    });
  }

  /**
   * Get call rates for display
   */
  public getCallRates(): CallRates {
    return { ...this.CALL_RATES };
  }

  /**
   * Format currency amount
   */
  public formatCurrency(amount: number): string {
    return `₹${amount.toFixed(2)}`;
  }

  /**
   * Format duration in minutes and seconds
   */
  public formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

export default CallBillingService;
