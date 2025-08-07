import { EventEmitter } from 'events';
import CallBillingService from './CallBillingService';
import WalletService from '../WalletService';
import { useCallStore } from '../../stores/callStoreSimplified';

export interface CallEndModalData {
  callType: 'voice' | 'video';
  isCallInitiator: boolean;
  amount: number;
  duration: string;
  callerName?: string;
  receiverName?: string;
}

class CallEndModalService extends EventEmitter {
  private static instance: CallEndModalService;

  private constructor() {
    super();
  }

  public static getInstance(): CallEndModalService {
    if (!CallEndModalService.instance) {
      CallEndModalService.instance = new CallEndModalService();
    }
    return CallEndModalService.instance;
  }

  /**
   * Show call end modal with billing information
   */
  public async showCallEndModal(
    callType: 'voice' | 'video',
    isCallInitiator: boolean,
    durationSeconds: number,
    callerName?: string,
    receiverName?: string
  ): Promise<void> {
    try {
      console.log('[CallEndModalService] Showing call end modal', {
        callType,
        isCallInitiator,
        durationSeconds,
        callerName,
        receiverName
      });

      // Get billing service and user info
      const billingService = CallBillingService.getInstance();
      const walletService = WalletService.getInstance();
      
      // Get current user balance and premium status
      const balance = await walletService.getBalance();
      const numericBalance = parseFloat(balance || '0');
      
      // For now, assume non-premium (you can enhance this to get actual premium status)
      const isPremium = false;
      
      // Calculate billing info
      const billingInfo = await billingService.calculateCallBilling(
        'current-user', // You can enhance this to get actual user ID
        callType,
        numericBalance,
        isPremium
      );

      // Calculate actual cost based on duration
      const durationMinutes = Math.ceil(durationSeconds / 60); // Round up for billing
      const actualCost = durationMinutes * billingInfo.ratePerMinute;

      // Format duration as MM:SS
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      const modalData: CallEndModalData = {
        callType,
        isCallInitiator,
        amount: actualCost,
        duration: formattedDuration,
        callerName,
        receiverName
      };

      // Emit event to show modal
      this.emit('showCallEndModal', modalData);

      console.log('[CallEndModalService] Call end modal data prepared', modalData);
    } catch (error) {
      console.error('[CallEndModalService] Error showing call end modal:', error);
    }
  }

  /**
   * Show call end modal based on current call session
   */
  public async showCallEndModalFromSession(): Promise<void> {
    try {
      const store = useCallStore.getState();
      const session = store.session;

      if (!session) {
        console.warn('[CallEndModalService] No session found, cannot show call end modal');
        return;
      }

      const durationSeconds = session.duration || 0;
      const isCallInitiator = session.direction === 'outgoing';
      
      await this.showCallEndModal(
        session.type,
        isCallInitiator,
        durationSeconds,
        isCallInitiator ? undefined : session.peerName, // callerName (if we received the call)
        isCallInitiator ? session.peerName : undefined  // receiverName (if we made the call)
      );
    } catch (error) {
      console.error('[CallEndModalService] Error showing call end modal from session:', error);
    }
  }

  /**
   * Calculate earnings for call receiver
   */
  private calculateReceiverEarnings(
    callType: 'voice' | 'video',
    durationMinutes: number,
    isPremium: boolean
  ): number {
    // Receiver earnings rates (typically lower than caller charges)
    const earningsRates = {
      voiceNonPremium: 1,   // ₹1 per minute for non-premium voice
      voicePremium: 2,      // ₹2 per minute for premium voice
      videoNonPremium: 2,   // ₹2 per minute for non-premium video
      videoPremium: 4,      // ₹4 per minute for premium video
    };

    let ratePerMinute: number;
    if (callType === 'voice') {
      ratePerMinute = isPremium ? earningsRates.voicePremium : earningsRates.voiceNonPremium;
    } else {
      ratePerMinute = isPremium ? earningsRates.videoPremium : earningsRates.videoNonPremium;
    }

    return durationMinutes * ratePerMinute;
  }

  /**
   * Enhanced method that calculates proper amounts for both caller and receiver
   */
  public async showCallEndModalWithProperBilling(
    callType: 'voice' | 'video',
    isCallInitiator: boolean,
    durationSeconds: number,
    callerName?: string,
    receiverName?: string,
    isPremium: boolean = false
  ): Promise<void> {
    try {
      console.log('[CallEndModalService] Showing call end modal with proper billing', {
        callType,
        isCallInitiator,
        durationSeconds,
        isPremium
      });

      const durationMinutes = Math.ceil(durationSeconds / 60); // Round up for billing
      let amount: number;

      if (isCallInitiator) {
        // User made the call - show money deducted
        const billingService = CallBillingService.getInstance();
        const rates = billingService.getCallRates();
        
        let ratePerMinute: number;
        if (callType === 'voice') {
          ratePerMinute = isPremium ? rates.voicePremium : rates.voiceNonPremium;
        } else {
          ratePerMinute = isPremium ? rates.videoPremium : rates.videoNonPremium;
        }
        
        amount = durationMinutes * ratePerMinute;
      } else {
        // User received the call - show money credited
        amount = this.calculateReceiverEarnings(callType, durationMinutes, isPremium);
      }

      // Format duration as MM:SS
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      const modalData: CallEndModalData = {
        callType,
        isCallInitiator,
        amount,
        duration: formattedDuration,
        callerName,
        receiverName
      };

      // Emit event to show modal
      this.emit('showCallEndModal', modalData);

      console.log('[CallEndModalService] Call end modal data prepared with proper billing', modalData);
    } catch (error) {
      console.error('[CallEndModalService] Error showing call end modal with proper billing:', error);
    }
  }
}

export default CallEndModalService;
