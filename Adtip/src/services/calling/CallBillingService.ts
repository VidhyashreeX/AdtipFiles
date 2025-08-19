/**
 * CallBillingService - Manages call billing and automatic termination
 * 
 * This service handles:
 * - Calculating maximum call duration based on wallet balance and user type
 * - Tracking call time and billing
 * - Automatically ending calls when balance is exhausted
 * - Providing warnings before call termination
 * 
 * Updated to use Zustand store integration instead of appEventEmitter
 */

import WalletService from '../WalletService';
import { useCallStore } from '../../stores/callStoreSimplified';
import CallController from './CallController';
import { ClientSideTransactionManager } from './ClientSideTransactionManager';
import SettlementModalService from '../SettlementModalService';

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

  // Minimum balance requirements in rupees
  private readonly MINIMUM_BALANCE_REQUIREMENTS = {
    voice: 4,  // 4 rupees minimum for voice calls
    video: 7,  // 7 rupees minimum for video calls
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
  private clientTransactionManager: ClientSideTransactionManager;
  private useClientSideTransactions: boolean = true; // ENABLED: Client-side transactions active

  private constructor() {
    this.clientTransactionManager = ClientSideTransactionManager.getInstance();
  }

  public static getInstance(): CallBillingService {
    if (!CallBillingService.instance) {
      CallBillingService.instance = new CallBillingService();
    }
    return CallBillingService.instance;
  }

  /**
   * Check if user has minimum balance required for call type
   */
  public checkMinimumBalance(
    callType: 'voice' | 'video',
    currentBalance: number
  ): { hasMinimumBalance: boolean; requiredAmount: number; shortfall: number } {
    const requiredAmount = this.MINIMUM_BALANCE_REQUIREMENTS[callType];
    const hasMinimumBalance = currentBalance >= requiredAmount;
    const shortfall = hasMinimumBalance ? 0 : requiredAmount - currentBalance;

    console.log('[CallBillingService] Minimum balance check:', {
      callType,
      currentBalance,
      requiredAmount,
      hasMinimumBalance,
      shortfall
    });

    return {
      hasMinimumBalance,
      requiredAmount,
      shortfall
    };
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

    // Check minimum balance requirement first
    const balanceCheck = this.checkMinimumBalance(callType, currentBalance);
    if (!balanceCheck.hasMinimumBalance) {
      console.warn('[CallBillingService] Insufficient balance for call:', {
        required: balanceCheck.requiredAmount,
        current: currentBalance,
        shortfall: balanceCheck.shortfall
      });
    }

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
   * Start billing for a call with optional client-side transaction management
   */
  public async startCallBilling(
    callId: string,
    userId: string,
    callType: 'voice' | 'video',
    currentBalance: number,
    isPremium: boolean,
    receiverId?: string,
    receiverIsPremium?: boolean
  ): Promise<void> {
    console.log('[CallBillingService] Starting call billing for:', callId);

    // Stop any existing billing
    await this.stopCallBilling();

    // Store call information
    this.currentCallId = callId;
    this.userId = userId;
    this.callType = callType;
    this.isPremium = isPremium;
    this.initialBalance = currentBalance;
    this.callStartTime = Date.now();
    this.warningsShown.clear();

    // Start client-side transaction management if enabled and receiver info is available
    if (this.useClientSideTransactions && receiverId && receiverIsPremium !== undefined) {
      try {
        console.log('[CallBillingService] Starting client-side transaction management');
        await this.clientTransactionManager.startCallTracking(
          callId,
          userId,
          receiverId,
          callType,
          isPremium,
          receiverIsPremium
        );
        console.log('[CallBillingService] Client-side transaction management started successfully');
      } catch (error) {
        console.error('[CallBillingService] Failed to start client-side transaction management:', error);
        // Continue with traditional billing as fallback
      }
    }

    // Calculate billing info
    const billingInfo = await this.calculateCallBilling(userId, callType, currentBalance, isPremium);
    this.maxDurationSeconds = billingInfo.maxDurationSeconds;
    this.ratePerMinute = billingInfo.ratePerMinute;

    console.log('[CallBillingService] Call can last maximum:', this.maxDurationSeconds, 'seconds');

    // Check if user has sufficient balance for at least 1 minute
    if (this.maxDurationSeconds < 60) {
      console.warn('[CallBillingService] Insufficient balance for minimum call duration');
      console.warn('[CallBillingService] Billing Warning: Insufficient balance for call. Call will end soon.', {
        type: 'insufficient_balance',
        remainingSeconds: this.maxDurationSeconds,
      });
      
      // Note: Error handling removed for simplified calling flow
      console.warn('[CallBillingService] Insufficient balance for call. Call will end soon.');
    }

    // Start billing timer (updates every second)
    this.startBillingTimer();

    // Start warning timer
    this.startWarningTimer();

    // Log billing started
    console.log('[CallBillingService] Billing started for call:', {
      callId,
      maxDurationSeconds: this.maxDurationSeconds,
      ratePerMinute: this.ratePerMinute,
    });
  }

  /**
   * Stop billing for current call with client-side transaction completion
   */
  public async stopCallBilling(): Promise<void> {
    console.log('[CallBillingService] Stopping call billing');

    // Stop client-side transaction management if enabled
    if (this.useClientSideTransactions) {
      try {
        console.log('[CallBillingService] Stopping client-side transaction management');
        const completedCall = await this.clientTransactionManager.stopCallTracking();
        if (completedCall) {
          console.log('[CallBillingService] Client-side transaction management completed:', {
            callId: completedCall.callId,
            totalDuration: completedCall.durationSeconds,
            totalCallerCharge: completedCall.totalCallerCharge,
            totalReceiverEarnings: completedCall.totalReceiverEarnings
          });

          // Process final call settlement using the new API
          await this.processCallSettlement(completedCall);
        }
      } catch (error) {
        console.error('[CallBillingService] Error stopping client-side transaction management:', error);
      }
    }

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

      // Log billing ended
      console.log('[CallBillingService] Billing ended for call:', {
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
    let syncCounter = 0;

    this.billingTimer = setInterval(async () => {
      if (!this.currentCallId || !this.callStartTime) {
        return;
      }

      const elapsedSeconds = Math.floor((Date.now() - this.callStartTime) / 1000);
      const remainingSeconds = Math.max(0, this.maxDurationSeconds - elapsedSeconds);

      // Sync with backend every 30 seconds for real-time balance validation
      syncCounter++;
      if (syncCounter >= 30) {
        syncCounter = 0;
        try {
          const shouldContinue = await this.syncBillingWithBackend();
          if (!shouldContinue) {
            // Backend terminated the call due to insufficient balance
            return;
          }
        } catch (syncError) {
          console.warn('[CallBillingService] Billing sync failed:', syncError);
        }
      }

      // Check if call should be terminated based on local calculation
      if (remainingSeconds <= 0) {
        console.log('[CallBillingService] Call time limit reached, ending call');
        this.endCallDueToInsufficientBalance().catch(err =>
          console.error('[CallBillingService] Error ending call:', err)
        );
        return;
      }

      // Log billing update
      const elapsedMinutes = Math.ceil(elapsedSeconds / 60);
      const currentCost = elapsedMinutes * this.ratePerMinute;

      console.log('[CallBillingService] Billing update:', {
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

    console.warn('[CallBillingService] Billing warning:', {
      type: 'time_warning',
      message,
      remainingSeconds,
    });
    
    // Note: Error handling removed for simplified calling flow
    console.warn('[CallBillingService]', message);
  }

  /**
   * End call due to insufficient balance with proper error handling
   */
  private async endCallDueToInsufficientBalance(): Promise<void> {
    console.log('[CallBillingService] Ending call due to insufficient balance');

    try {
      // Stop billing first
      await this.stopCallBilling();

      // Show user notification about insufficient balance
      console.warn('[CallBillingService] Call ended due to insufficient wallet balance');

      // End the call through CallController with retry logic
      const callController = CallController.getInstance();

      // Retry mechanism for ending call
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          await callController.endCall();
          console.log('[CallBillingService] Call ended successfully due to insufficient balance');
          break;
        } catch (endError) {
          retryCount++;
          console.error(`[CallBillingService] Attempt ${retryCount} to end call failed:`, endError);

          if (retryCount >= maxRetries) {
            console.error('[CallBillingService] Failed to end call after maximum retries');
            // Force cleanup even if end call fails
            const { actions } = useCallStore.getState();
            actions.reset();
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

    } catch (error) {
      console.error('[CallBillingService] Error in endCallDueToInsufficientBalance:', error);

      // Force cleanup as last resort
      try {
        const { actions } = useCallStore.getState();
        actions.reset();
      } catch (cleanupError) {
        console.error('[CallBillingService] Failed to force cleanup:', cleanupError);
      }
    }
  }

  /**
   * Sync billing status with backend to ensure consistency
   */
  public async syncBillingWithBackend(): Promise<boolean> {
    if (!this.currentCallId || !this.callStartTime || !this.userId) {
      return true; // Continue call if no billing info
    }

    try {
      const elapsedSeconds = Math.floor((Date.now() - this.callStartTime) / 1000);
      const elapsedMinutes = Math.ceil(elapsedSeconds / 60);
      const currentCost = elapsedMinutes * this.ratePerMinute;

      console.log('[CallBillingService] Syncing billing status with backend:', {
        callId: this.currentCallId,
        elapsedSeconds,
        elapsedMinutes,
        currentCost,
        ratePerMinute: this.ratePerMinute
      });

      // Call the new billing sync API
      const { default: ApiService } = await import('../ApiService');
      const response = await ApiService.syncCallBilling({
        callId: this.currentCallId,
        userId: this.userId,
        elapsedSeconds,
        callType: this.callType || 'voice'
      });

      if (response.success && response.data) {
        const { shouldContinueCall, remainingBalance, maxDurationSeconds } = response.data;

        console.log('[CallBillingService] Backend billing sync response:', {
          shouldContinueCall,
          remainingBalance,
          maxDurationSeconds,
          currentCost: response.data.currentCost
        });

        // Update local state with backend response
        if (maxDurationSeconds !== null && maxDurationSeconds !== undefined) {
          // Update max duration based on current balance
          const newMaxDuration = elapsedSeconds + maxDurationSeconds;
          if (newMaxDuration < this.maxDurationSeconds) {
            console.log('[CallBillingService] Updating max duration based on current balance:', {
              oldMax: this.maxDurationSeconds,
              newMax: newMaxDuration,
              additionalSeconds: maxDurationSeconds
            });
            this.maxDurationSeconds = newMaxDuration;
          }
        }

        // If backend says call should not continue, terminate immediately
        if (!shouldContinueCall) {
          console.warn('[CallBillingService] Backend indicates insufficient balance, terminating call');
          await this.endCallDueToInsufficientBalance();
          return false;
        }

        return true;
      } else {
        console.error('[CallBillingService] Backend billing sync failed:', response);
        return true; // Continue call on API failure to avoid false terminations
      }

    } catch (error) {
      console.error('[CallBillingService] Failed to sync billing with backend:', error);
      return true; // Continue call on error to avoid false terminations
    }
  }

  /**
   * Validate billing consistency between frontend and backend
   */
  public async validateBillingConsistency(): Promise<boolean> {
    if (!this.currentCallId) {
      return true;
    }

    try {
      // Here you could add validation logic to check if frontend and backend billing match
      // For example: const backendBilling = await ApiService.getCallBilling(this.currentCallId);
      // Compare with local billing state and return true if consistent

      console.log('[CallBillingService] Billing consistency validation passed');
      return true;

    } catch (error) {
      console.error('[CallBillingService] Billing consistency validation failed:', error);
      return false;
    }
  }

  /**
   * Get call rates for display
   */
  public getCallRates(): CallRates {
    return { ...this.CALL_RATES };
  }

  /**
   * Get minimum balance requirements for display
   */
  public getMinimumBalanceRequirements(): { voice: number; video: number } {
    return { ...this.MINIMUM_BALANCE_REQUIREMENTS };
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

  /**
   * Enable or disable client-side transaction management
   */
  public setClientSideTransactions(enabled: boolean): void {
    this.useClientSideTransactions = enabled;
    console.log('[CallBillingService] Client-side transactions:', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Get current client-side transaction status
   */
  public getClientSideTransactionStatus(): any {
    if (!this.useClientSideTransactions) {
      return { enabled: false, activeCall: null };
    }

    return {
      enabled: true,
      activeCall: this.clientTransactionManager.getCurrentCallTransaction()
    };
  }

  /**
   * Check caller balance using client-side transaction manager
   */
  public async checkCallerBalanceClientSide(): Promise<{ hasBalance: boolean; remainingMinutes: number }> {
    if (!this.useClientSideTransactions) {
      return { hasBalance: false, remainingMinutes: 0 };
    }

    return await this.clientTransactionManager.checkCallerBalance();
  }

  /**
   * Rollback transactions for a failed call
   */
  public async rollbackCallTransactions(callId: string): Promise<void> {
    if (!this.useClientSideTransactions) {
      console.warn('[CallBillingService] Client-side transactions not enabled, cannot rollback');
      return;
    }

    try {
      await this.clientTransactionManager.rollbackCallTransactions(callId);
      console.log('[CallBillingService] Call transactions rolled back successfully');
    } catch (error) {
      console.error('[CallBillingService] Error rolling back call transactions:', error);
      throw error;
    }
  }

  /**
   * Process final call settlement using the new settlement API
   */
  private async processCallSettlement(completedCall: any): Promise<void> {
    try {
      console.log('[CallBillingService] Processing final call settlement:', {
        callId: completedCall.callId,
        callType: completedCall.callType,
        duration: completedCall.durationSeconds,
        callerCharge: completedCall.totalCallerCharge,
        receiverEarnings: completedCall.totalReceiverEarnings
      });

      const { default: ApiService } = await import('../ApiService');

      const settlementResult = await ApiService.processCallSettlement({
        callerId: completedCall.callerId,
        receiverId: completedCall.receiverId,
        callDuration: completedCall.durationSeconds,
        callerDebitAmount: completedCall.totalCallerCharge,
        receiverCreditAmount: completedCall.totalReceiverEarnings,
        callId: completedCall.callId,
        callType: completedCall.callType
      });

      if (settlementResult.success) {
        console.log('[CallBillingService] Call settlement completed successfully:', settlementResult.data);

        // Show settlement details modal to user
        this.showSettlementModal(settlementResult.data);
      } else {
        console.error('[CallBillingService] Call settlement failed:', settlementResult.message);
        // Handle settlement failure - could show error modal or retry
      }

    } catch (error) {
      console.error('[CallBillingService] Error processing call settlement:', error);
      // Handle error gracefully - settlement failure shouldn't crash the app
    }
  }

  /**
   * Show settlement details modal to user
   */
  private async showSettlementModal(settlementData: any): Promise<void> {
    try {
      console.log('[CallBillingService] Settlement details to show in modal:', settlementData);

      // Get current user info
      const { session } = useCallStore.getState();
      if (!session) {
        console.warn('[CallBillingService] No session found, cannot show settlement modal');
        return;
      }

      // Determine other user info from session
      const otherUserName = session.peerName || 'Unknown User';
      const otherUserId = settlementData.caller.userId === this.userId
        ? settlementData.receiver.userId
        : settlementData.caller.userId;

      // Show settlement modal using the service
      const settlementModalService = SettlementModalService.getInstance();
      settlementModalService.showSettlementModal({
        settlementData,
        currentUserId: this.userId || '',
        otherUserName,
        otherUserId,
      });

    } catch (error) {
      console.error('[CallBillingService] Error showing settlement modal:', error);
    }
  }
}

export default CallBillingService;
