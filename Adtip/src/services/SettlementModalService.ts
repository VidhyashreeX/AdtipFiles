// src/services/SettlementModalService.ts
import { EventEmitter } from 'events';

interface CallSettlementData {
  callId: string;
  callType: 'voice' | 'video';
  callDuration: number;
  caller: {
    userId: string;
    debitAmount: number;
    newBalance: number;
    previousBalance: number;
  };
  receiver: {
    userId: string;
    creditAmount: number;
    newBalance: number;
    previousBalance: number;
  };
  settlementTime: string;
  status: string;
}

interface SettlementModalData {
  settlementData: CallSettlementData;
  currentUserId: string;
  otherUserName?: string;
  otherUserId?: string;
}

/**
 * Service to manage call settlement modal display globally
 */
class SettlementModalService extends EventEmitter {
  private static instance: SettlementModalService;

  static getInstance(): SettlementModalService {
    if (!this.instance) {
      this.instance = new SettlementModalService();
    }
    return this.instance;
  }

  /**
   * Show settlement modal with provided data
   */
  showSettlementModal(data: SettlementModalData): void {
    console.log('[SettlementModalService] Showing settlement modal:', data);
    this.emit('showSettlementModal', data);
  }

  /**
   * Hide settlement modal
   */
  hideSettlementModal(): void {
    console.log('[SettlementModalService] Hiding settlement modal');
    this.emit('hideSettlementModal');
  }

  /**
   * Subscribe to settlement modal events
   */
  onShowSettlementModal(callback: (data: SettlementModalData) => void): () => void {
    this.on('showSettlementModal', callback);
    return () => this.off('showSettlementModal', callback);
  }

  /**
   * Subscribe to hide settlement modal events
   */
  onHideSettlementModal(callback: () => void): () => void {
    this.on('hideSettlementModal', callback);
    return () => this.off('hideSettlementModal', callback);
  }
}

export default SettlementModalService;
export type { CallSettlementData, SettlementModalData };
