/**
 * Client-Side Transaction Manager for Call Billing
 * 
 * This service handles real-time call transaction calculations on the client side
 * instead of relying on backend calculations. It provides:
 * - Real-time credit/debit tracking during calls
 * - Client-side transaction calculations
 * - API calls for wallet balance updates
 * - Transaction rollback mechanisms
 * - Error handling and retry logic
 */

import { Logger } from '../../utils/ProductionLogger';
import ApiService from '../ApiService';
import WalletService from '../WalletService';

export interface CallTransaction {
  callId: string;
  callerId: string;
  receiverId: string;
  callType: 'voice' | 'video';
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  callerChargePerMinute: number;
  receiverEarningsPerMinute: number;
  totalCallerCharge: number;
  totalReceiverEarnings: number;
  status: 'active' | 'completed' | 'failed' | 'rolled_back';
  transactions: TransactionRecord[];
}

export interface TransactionRecord {
  id: string;
  timestamp: number;
  type: 'debit' | 'credit';
  userId: string;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  retryCount: number;
  error?: string;
}

export interface CallRates {
  voice: {
    premium: { caller: 4, receiver: 2 };
    nonPremium: { caller: 7, receiver: 1 };
  };
  video: {
    premium: { caller: 7, receiver: 4 };
    nonPremium: { caller: 14, receiver: 2 };
  };
}

export class ClientSideTransactionManager {
  private static instance: ClientSideTransactionManager;
  private activeCall: CallTransaction | null = null;
  private transactionInterval: NodeJS.Timeout | null = null;
  private readonly TRANSACTION_INTERVAL = 60000; // 1 minute
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

  private readonly callRates: CallRates = {
    voice: {
      premium: { caller: 4, receiver: 2 },
      nonPremium: { caller: 7, receiver: 1 }
    },
    video: {
      premium: { caller: 7, receiver: 4 },
      nonPremium: { caller: 14, receiver: 2 }
    }
  };

  static getInstance(): ClientSideTransactionManager {
    if (!this.instance) {
      this.instance = new ClientSideTransactionManager();
    }
    return this.instance;
  }

  /**
   * Start tracking a call and begin real-time transaction processing
   */
  async startCallTracking(
    callId: string,
    callerId: string,
    receiverId: string,
    callType: 'voice' | 'video',
    callerIsPremium: boolean,
    receiverIsPremium: boolean
  ): Promise<void> {
    try {
      Logger.info('ClientTransactionManager', 'Starting call tracking', {
        callId,
        callerId,
        receiverId,
        callType,
        callerIsPremium,
        receiverIsPremium
      });

      // Stop any existing call tracking
      await this.stopCallTracking();

      // Get call rates based on premium status
      const rates = this.callRates[callType];
      const callerChargePerMinute = callerIsPremium ? rates.premium.caller : rates.nonPremium.caller;
      const receiverEarningsPerMinute = receiverIsPremium ? rates.premium.receiver : rates.nonPremium.receiver;

      // Initialize call transaction
      this.activeCall = {
        callId,
        callerId,
        receiverId,
        callType,
        startTime: Date.now(),
        durationSeconds: 0,
        callerChargePerMinute,
        receiverEarningsPerMinute,
        totalCallerCharge: 0,
        totalReceiverEarnings: 0,
        status: 'active',
        transactions: []
      };

      // Start periodic transaction processing
      this.transactionInterval = setInterval(() => {
        this.processPeriodicTransaction();
      }, this.TRANSACTION_INTERVAL);

      Logger.info('ClientTransactionManager', 'Call tracking started successfully');

    } catch (error) {
      Logger.error('ClientTransactionManager', 'Error starting call tracking', error);
      throw error;
    }
  }

  /**
   * Stop call tracking and process final transactions
   */
  async stopCallTracking(): Promise<CallTransaction | null> {
    try {
      if (!this.activeCall) {
        return null;
      }

      Logger.info('ClientTransactionManager', 'Stopping call tracking', {
        callId: this.activeCall.callId
      });

      // Clear the interval
      if (this.transactionInterval) {
        clearInterval(this.transactionInterval);
        this.transactionInterval = null;
      }

      // Calculate final duration and process final transaction
      const endTime = Date.now();
      this.activeCall.endTime = endTime;
      this.activeCall.durationSeconds = Math.floor((endTime - this.activeCall.startTime) / 1000);

      // Process final transaction for any remaining time
      await this.processPeriodicTransaction(true);

      // Mark call as completed
      this.activeCall.status = 'completed';

      const completedCall = this.activeCall;
      this.activeCall = null;

      Logger.info('ClientTransactionManager', 'Call tracking stopped successfully', {
        callId: completedCall.callId,
        totalDuration: completedCall.durationSeconds,
        totalCallerCharge: completedCall.totalCallerCharge,
        totalReceiverEarnings: completedCall.totalReceiverEarnings
      });

      return completedCall;

    } catch (error) {
      Logger.error('ClientTransactionManager', 'Error stopping call tracking', error);
      throw error;
    }
  }

  /**
   * Process periodic transaction (every minute)
   */
  private async processPeriodicTransaction(isFinal: boolean = false): Promise<void> {
    if (!this.activeCall) {
      return;
    }

    try {
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - this.activeCall.startTime) / 1000);
      const elapsedMinutes = Math.ceil(elapsedSeconds / 60);
      
      // Calculate charges for this minute
      const callerCharge = this.activeCall.callerChargePerMinute;
      const receiverEarnings = this.activeCall.receiverEarningsPerMinute;

      // Update totals
      this.activeCall.durationSeconds = elapsedSeconds;
      this.activeCall.totalCallerCharge = elapsedMinutes * this.activeCall.callerChargePerMinute;
      this.activeCall.totalReceiverEarnings = elapsedMinutes * this.activeCall.receiverEarningsPerMinute;

      Logger.info('ClientTransactionManager', 'Processing periodic transaction', {
        callId: this.activeCall.callId,
        elapsedMinutes,
        callerCharge,
        receiverEarnings,
        isFinal
      });

      // Create debit transaction for caller
      const debitTransaction: TransactionRecord = {
        id: `${this.activeCall.callId}_debit_${Date.now()}`,
        timestamp: currentTime,
        type: 'debit',
        userId: this.activeCall.callerId,
        amount: callerCharge,
        description: `${this.activeCall.callType} call charge - ${elapsedMinutes} minute(s)`,
        status: 'pending',
        retryCount: 0
      };

      // Create credit transaction for receiver
      const creditTransaction: TransactionRecord = {
        id: `${this.activeCall.callId}_credit_${Date.now()}`,
        timestamp: currentTime,
        type: 'credit',
        userId: this.activeCall.receiverId,
        amount: receiverEarnings,
        description: `${this.activeCall.callType} call earnings - ${elapsedMinutes} minute(s)`,
        status: 'pending',
        retryCount: 0
      };

      // Add transactions to call record
      this.activeCall.transactions.push(debitTransaction, creditTransaction);

      // Process transactions
      await Promise.all([
        this.processTransaction(debitTransaction),
        this.processTransaction(creditTransaction)
      ]);

    } catch (error) {
      Logger.error('ClientTransactionManager', 'Error processing periodic transaction', error);
    }
  }

  /**
   * Process individual transaction with retry logic
   */
  private async processTransaction(transaction: TransactionRecord): Promise<void> {
    try {
      Logger.info('ClientTransactionManager', 'Processing transaction', {
        id: transaction.id,
        type: transaction.type,
        userId: transaction.userId,
        amount: transaction.amount
      });

      if (transaction.type === 'debit') {
        await this.processDebitTransaction(transaction);
      } else {
        await this.processCreditTransaction(transaction);
      }

      transaction.status = 'completed';
      Logger.info('ClientTransactionManager', 'Transaction completed successfully', {
        id: transaction.id
      });

    } catch (error) {
      Logger.error('ClientTransactionManager', 'Transaction failed', {
        id: transaction.id,
        error: error instanceof Error ? error.message : String(error)
      });

      transaction.error = error instanceof Error ? error.message : String(error);
      transaction.retryCount++;

      // Retry if under max attempts
      if (transaction.retryCount < this.MAX_RETRY_ATTEMPTS) {
        Logger.info('ClientTransactionManager', 'Retrying transaction', {
          id: transaction.id,
          retryCount: transaction.retryCount
        });

        setTimeout(() => {
          this.processTransaction(transaction);
        }, this.RETRY_DELAY * transaction.retryCount);
      } else {
        transaction.status = 'failed';
        Logger.error('ClientTransactionManager', 'Transaction failed permanently', {
          id: transaction.id,
          retryCount: transaction.retryCount
        });
      }
    }
  }

  /**
   * Process debit transaction (charge caller)
   */
  private async processDebitTransaction(transaction: TransactionRecord): Promise<void> {
    try {
      // Create a withdrawal transaction
      const response = await ApiService.post('/withdrawFundFromWallet', {
        userId: parseInt(transaction.userId),
        withdraw_req_amount: transaction.amount,
        transaction_type: 'Call Charge',
        check_bal_flag: 'DEDUCT_BAL'
      });

      if (response.status !== 200) {
        throw new Error(`Debit transaction failed: ${response.message || 'Unknown error'}`);
      }

      Logger.info('ClientTransactionManager', 'Debit transaction successful', {
        transactionId: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount
      });

    } catch (error) {
      Logger.error('ClientTransactionManager', 'Debit transaction error', error);
      throw error;
    }
  }

  /**
   * Process credit transaction (pay receiver)
   */
  private async processCreditTransaction(transaction: TransactionRecord): Promise<void> {
    try {
      // Create an add funds transaction
      const response = await ApiService.post('/addfunds', {
        createdby: parseInt(transaction.userId),
        amount: transaction.amount,
        transactionStatus: '1',
        transaction_type: 'Call Earnings',
        order_id: `call_earnings_${transaction.id}`,
        payment_id: `call_payment_${transaction.id}`,
        isCron: true // Skip transaction record creation
      });

      if (response.status !== 200) {
        throw new Error(`Credit transaction failed: ${response.message || 'Unknown error'}`);
      }

      Logger.info('ClientTransactionManager', 'Credit transaction successful', {
        transactionId: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount
      });

    } catch (error) {
      Logger.error('ClientTransactionManager', 'Credit transaction error', error);
      throw error;
    }
  }

  /**
   * Get current call transaction status
   */
  getCurrentCallTransaction(): CallTransaction | null {
    return this.activeCall;
  }

  /**
   * Check if caller has sufficient balance for call continuation
   */
  async checkCallerBalance(): Promise<{ hasBalance: boolean; remainingMinutes: number }> {
    if (!this.activeCall) {
      return { hasBalance: false, remainingMinutes: 0 };
    }

    try {
      const currentBalance = parseFloat(await WalletService.getWalletBalance(this.activeCall.callerId));
      const remainingMinutes = Math.floor(currentBalance / this.activeCall.callerChargePerMinute);

      return {
        hasBalance: remainingMinutes > 0,
        remainingMinutes
      };

    } catch (error) {
      Logger.error('ClientTransactionManager', 'Error checking caller balance', error);
      return { hasBalance: false, remainingMinutes: 0 };
    }
  }

  /**
   * Rollback transactions for a failed call
   */
  async rollbackCallTransactions(callId: string): Promise<void> {
    try {
      Logger.info('ClientTransactionManager', 'Rolling back call transactions', { callId });

      if (this.activeCall && this.activeCall.callId === callId) {
        // Process rollback for each completed transaction
        for (const transaction of this.activeCall.transactions) {
          if (transaction.status === 'completed') {
            await this.rollbackTransaction(transaction);
          }
        }

        this.activeCall.status = 'rolled_back';
        Logger.info('ClientTransactionManager', 'Call transactions rolled back successfully', { callId });
      }

    } catch (error) {
      Logger.error('ClientTransactionManager', 'Error rolling back transactions', error);
      throw error;
    }
  }

  /**
   * Rollback individual transaction
   */
  private async rollbackTransaction(transaction: TransactionRecord): Promise<void> {
    try {
      if (transaction.type === 'debit') {
        // Refund the caller
        await this.processCreditTransaction({
          ...transaction,
          id: `rollback_${transaction.id}`,
          type: 'credit',
          description: `Refund: ${transaction.description}`
        });
      } else {
        // Deduct from receiver
        await this.processDebitTransaction({
          ...transaction,
          id: `rollback_${transaction.id}`,
          type: 'debit',
          description: `Rollback: ${transaction.description}`
        });
      }

      Logger.info('ClientTransactionManager', 'Transaction rolled back', {
        originalId: transaction.id,
        type: transaction.type
      });

    } catch (error) {
      Logger.error('ClientTransactionManager', 'Error rolling back transaction', error);
      throw error;
    }
  }
}

export default ClientSideTransactionManager;
