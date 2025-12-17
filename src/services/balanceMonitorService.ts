// Wallet Balance Monitoring Service for Live Streams
import { useWalletPremiumStore } from '../stores/wallet-premium.store';
import { useLiveStreamStore } from '../stores/livestream.store';
import { userAPI } from './api';
import { toast } from 'sonner';

interface BalanceMonitorConfig {
  userId: number;
  streamType: 'free' | 'influencer' | 'promotional';
  costPerMinute: number;
  checkInterval: number; // in milliseconds
  warningThreshold: number; // balance threshold for warnings
}

class BalanceMonitorService {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private config: BalanceMonitorConfig | null = null;
  private lastBalance: number = 0;
  private warningShown: boolean = false;
  private isMonitoring: boolean = false;

  // Start monitoring wallet balance during live stream
  startMonitoring(config: BalanceMonitorConfig): void {
    if (this.isMonitoring) {
      console.warn('[BalanceMonitor] Already monitoring balance');
      return;
    }

    this.config = config;
    this.isMonitoring = true;
    this.warningShown = false;

    console.log('[BalanceMonitor] Starting balance monitoring:', config);

    // Initial balance check
    this.checkBalance();

    // Set up periodic balance checks
    this.monitoringInterval = setInterval(() => {
      this.checkBalance();
    }, config.checkInterval);
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    this.config = null;
    this.warningShown = false;

    console.log('[BalanceMonitor] Stopped balance monitoring');
  }

  // Check current wallet balance
  private async checkBalance(): Promise<void> {
    if (!this.config) return;

    try {
      const response = await userAPI.getWalletBalance(this.config.userId.toString());
      
      if (response.data.status === 200) {
        const currentBalance = parseFloat(response.data.availableBalance) || 0;
        
        // Update wallet store
        useWalletPremiumStore.getState().updateWalletBalance(currentBalance);
        
        // Check for balance changes and warnings
        this.handleBalanceUpdate(currentBalance);
        
        this.lastBalance = currentBalance;
      }
    } catch (error) {
      console.error('[BalanceMonitor] Failed to check balance:', error);
    }
  }

  // Handle balance updates and warnings
  private handleBalanceUpdate(currentBalance: number): void {
    if (!this.config) return;

    const { streamType, costPerMinute, warningThreshold } = this.config;
    
    // Only monitor balance for paid streams (influencer type)
    if (streamType !== 'influencer' || costPerMinute === 0) {
      return;
    }

    // Calculate minutes remaining at current cost
    const minutesRemaining = Math.floor(currentBalance / costPerMinute);
    
    // Show warning if balance is getting low
    if (currentBalance <= warningThreshold && !this.warningShown) {
      this.warningShown = true;
      
      toast.error(
        `Low balance warning! You have ₹${currentBalance.toFixed(2)} remaining (${minutesRemaining} minutes at ₹${costPerMinute}/min)`,
        {
          duration: 10000,
          action: {
            label: 'Add Funds',
            onClick: () => {
              // Navigate to add funds page
              window.location.href = '/add-funds';
            },
          },
        }
      );
    }

    // Auto-end stream if balance is insufficient
    if (currentBalance < costPerMinute) {
      this.handleInsufficientBalance();
    }

    // Update live stream store with cost tracking
    const streamStore = useLiveStreamStore.getState();
    const sessionDuration = streamStore.sessionDuration;
    const totalCost = Math.ceil(sessionDuration / 60) * costPerMinute;
    
    streamStore.updateCost(totalCost - streamStore.totalCost);
  }

  // Handle insufficient balance scenario
  private handleInsufficientBalance(): void {
    console.log('[BalanceMonitor] Insufficient balance - ending stream');
    
    toast.error(
      'Insufficient balance! Your stream will end automatically.',
      {
        duration: 15000,
        action: {
          label: 'Add Funds',
          onClick: () => {
            window.location.href = '/add-funds';
          },
        },
      }
    );

    // Add system message to chat
    const streamStore = useLiveStreamStore.getState();
    streamStore.addChatMessage({
      id: `system_${Date.now()}`,
      userId: 0,
      userName: 'System',
      message: 'Stream ended due to insufficient wallet balance',
      timestamp: Date.now(),
      type: 'system',
    });

    // End the stream after a short delay
    setTimeout(() => {
      if (this.config) {
        streamStore.endStream(this.config.userId);
      }
      this.stopMonitoring();
    }, 5000); // 5 second delay to show the message
  }

  // Get current monitoring status
  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }

  // Get current config
  getCurrentConfig(): BalanceMonitorConfig | null {
    return this.config;
  }

  // Update warning threshold
  updateWarningThreshold(threshold: number): void {
    if (this.config) {
      this.config.warningThreshold = threshold;
      this.warningShown = false; // Reset warning flag
    }
  }

  // Manual balance refresh
  async refreshBalance(): Promise<number | null> {
    if (!this.config) return null;

    try {
      const response = await userAPI.getWalletBalance(this.config.userId.toString());
      
      if (response.data.status === 200) {
        const balance = parseFloat(response.data.availableBalance) || 0;
        useWalletPremiumStore.getState().updateWalletBalance(balance);
        return balance;
      }
    } catch (error) {
      console.error('[BalanceMonitor] Failed to refresh balance:', error);
    }

    return null;
  }
}

// Create singleton instance
export const balanceMonitorService = new BalanceMonitorService();
export default balanceMonitorService;

// React hook for using balance monitor service
export const useBalanceMonitor = () => {
  const startMonitoring = (config: BalanceMonitorConfig) => 
    balanceMonitorService.startMonitoring(config);
  
  const stopMonitoring = () => balanceMonitorService.stopMonitoring();
  
  const isMonitoring = () => balanceMonitorService.isCurrentlyMonitoring();
  
  const refreshBalance = () => balanceMonitorService.refreshBalance();
  
  const updateWarningThreshold = (threshold: number) => 
    balanceMonitorService.updateWarningThreshold(threshold);

  return {
    startMonitoring,
    stopMonitoring,
    isMonitoring,
    refreshBalance,
    updateWarningThreshold,
  };
};