// Enhanced Wallet and Premium State Management Store with Fixed Currency Conversion
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { userAPI } from '../services/api';
import { premiumService } from '../services/premiumService';
import { 
  formatCurrency, 
  convertCurrency,
  Currency,
  getUserCurrency 
} from '../utils/currencyUtils';

// Interfaces
interface WalletState {
  balance: number;
  currency: Currency;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

interface PremiumState {
  isPremium: boolean;
  isContentCreatorPremium: boolean;
  premiumPlanId: number;
  contentCreatorPlanId: number;
  premiumExpiresAt: string | null;
  contentCreatorExpiresAt: string | null;
  premiumPlanName: string | null;
  contentCreatorPlanName: string | null;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

interface TransactionHistory {
  id: string;
  type: 'deposit' | 'withdrawal' | 'subscription' | 'earning';
  amount: number;
  currency: Currency;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  timestamp: number;
  orderId?: string;
  paymentId?: string;
}

interface EnhancedWalletPremiumStore {
  // State
  wallet: WalletState;
  premium: PremiumState;
  transactions: TransactionHistory[];
  
  // Actions
  initializeWalletData: (userId: string) => Promise<void>;
  initializePremiumData: (userId: string) => Promise<void>;
  refreshWalletBalance: (userId: string) => Promise<void>;
  refreshPremiumStatus: (userId: string) => Promise<void>;
  
  // Wallet actions
  updateWalletBalance: (newBalance: number) => void;
  addTransaction: (transaction: Omit<TransactionHistory, 'id' | 'timestamp'>) => void;
  
  // Premium actions
  updatePremiumStatus: (premiumData: Partial<PremiumState>) => void;
  
  // Enhanced Currency utilities
  formatCurrency: (amount: number, currency?: Currency) => string;
  convertCurrency: (amount: number, from: Currency, to: Currency) => number;
  formatCurrencyWithConversion: (amount: number, fromCurrency: Currency, toCurrency?: Currency) => string;
  
  // Clear actions
  clearWalletData: () => void;
  clearPremiumData: () => void;
  clearError: () => void;
}

const generateTransactionId = (): string => {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

// Create the enhanced store
export const useEnhancedWalletPremiumStore = create<EnhancedWalletPremiumStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        wallet: {
          balance: 0,
          currency: getUserCurrency(),
          lastUpdated: 0,
          isLoading: false,
          error: null,
        },
        premium: {
          isPremium: false,
          isContentCreatorPremium: false,
          premiumPlanId: 0,
          contentCreatorPlanId: 0,
          premiumExpiresAt: null,
          contentCreatorExpiresAt: null,
          premiumPlanName: null,
          contentCreatorPlanName: null,
          lastUpdated: 0,
          isLoading: false,
          error: null,
        },
        transactions: [],

        // Initialize wallet data
        initializeWalletData: async (userId: string) => {
          set((state) => ({
            wallet: { ...state.wallet, isLoading: true, error: null }
          }), false, 'wallet/initializeWalletData/start');

          try {
            const response = await userAPI.getWalletBalance(userId);
            
            if (response.data.status === 200) {
              const balance = parseFloat(response.data.availableBalance) || 0;
              
              set((state) => ({
                wallet: {
                  ...state.wallet,
                  balance,
                  lastUpdated: Date.now(),
                  isLoading: false,
                  error: null,
                }
              }), false, 'wallet/initializeWalletData/success');
            } else {
              throw new Error(response.data.message || 'Failed to fetch wallet balance');
            }
          } catch (error: any) {
            console.error('Failed to initialize wallet data:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to load wallet data';
            
            set((state) => ({
              wallet: {
                ...state.wallet,
                isLoading: false,
                error: errorMessage,
              }
            }), false, 'wallet/initializeWalletData/error');
          }
        },

        // Initialize premium data
        initializePremiumData: async (userId: string) => {
          set((state) => ({
            premium: { ...state.premium, isLoading: true, error: null }
          }), false, 'premium/initializePremiumData/start');

          try {
            // Fetch both premium statuses in parallel
            const [premiumStatus, contentCreatorStatus] = await Promise.allSettled([
              premiumService.checkPremiumStatus(userId),
              premiumService.checkContentCreatorPremium(userId)
            ]);

            let premiumData: Partial<PremiumState> = {
              lastUpdated: Date.now(),
              isLoading: false,
              error: null,
            };

            // Process premium status
            if (premiumStatus.status === 'fulfilled' && premiumStatus.value) {
              premiumData.isPremium = premiumStatus.value.is_premium;
              premiumData.premiumPlanId = premiumStatus.value.premium_plan_id;
              premiumData.premiumExpiresAt = premiumStatus.value.premium_expires_at || null;
              premiumData.premiumPlanName = premiumStatus.value.premium_plan_name || null;
            }

            // Process content creator status
            if (contentCreatorStatus.status === 'fulfilled' && contentCreatorStatus.value) {
              premiumData.isContentCreatorPremium = contentCreatorStatus.value.is_content_creator;
              premiumData.contentCreatorPlanId = contentCreatorStatus.value.content_creator_plan_id;
              premiumData.contentCreatorExpiresAt = contentCreatorStatus.value.content_creator_expires_at || null;
              premiumData.contentCreatorPlanName = contentCreatorStatus.value.content_creator_plan_name || null;
            }

            set((state) => ({
              premium: { ...state.premium, ...premiumData }
            }), false, 'premium/initializePremiumData/success');

          } catch (error: any) {
            console.error('Failed to initialize premium data:', error);
            const errorMessage = error.message || 'Failed to load premium data';
            
            set((state) => ({
              premium: {
                ...state.premium,
                isLoading: false,
                error: errorMessage,
              }
            }), false, 'premium/initializePremiumData/error');
          }
        },

        // Refresh wallet balance
        refreshWalletBalance: async (userId: string) => {
          await get().initializeWalletData(userId);
        },

        // Refresh premium status
        refreshPremiumStatus: async (userId: string) => {
          await get().initializePremiumData(userId);
        },

        // Update wallet balance (for real-time updates)
        updateWalletBalance: (newBalance: number) => {
          set((state) => ({
            wallet: {
              ...state.wallet,
              balance: newBalance,
              lastUpdated: Date.now(),
            }
          }), false, 'wallet/updateWalletBalance');
        },

        // Add transaction to history
        addTransaction: (transaction: Omit<TransactionHistory, 'id' | 'timestamp'>) => {
          const newTransaction: TransactionHistory = {
            ...transaction,
            id: generateTransactionId(),
            timestamp: Date.now(),
          };

          set((state) => ({
            transactions: [newTransaction, ...state.transactions].slice(0, 100) // Keep last 100 transactions
          }), false, 'wallet/addTransaction');

          // Update wallet balance if transaction is completed
          if (transaction.status === 'completed') {
            const currentBalance = get().wallet.balance;
            let newBalance = currentBalance;

            if (transaction.type === 'deposit' || transaction.type === 'earning') {
              newBalance += transaction.amount;
            } else if (transaction.type === 'withdrawal' || transaction.type === 'subscription') {
              newBalance -= transaction.amount;
            }

            get().updateWalletBalance(Math.max(0, newBalance));
          }
        },

        // Update premium status (for real-time updates)
        updatePremiumStatus: (premiumData: Partial<PremiumState>) => {
          set((state) => ({
            premium: {
              ...state.premium,
              ...premiumData,
              lastUpdated: Date.now(),
            }
          }), false, 'premium/updatePremiumStatus');
        },

        // Enhanced Currency formatting
        formatCurrency: (amount: number, currency?: Currency) => {
          const curr = currency || get().wallet.currency;
          return formatCurrency(amount, curr);
        },

        // Enhanced Currency conversion
        convertCurrency: (amount: number, from: Currency, to: Currency) => {
          return convertCurrency(amount, from, to);
        },

        // Format currency with automatic conversion
        formatCurrencyWithConversion: (amount: number, fromCurrency: Currency, toCurrency?: Currency) => {
          const targetCurrency = toCurrency || get().wallet.currency;
          const convertedAmount = convertCurrency(amount, fromCurrency, targetCurrency);
          return formatCurrency(convertedAmount, targetCurrency);
        },

        // Clear wallet data
        clearWalletData: () => {
          set((state) => ({
            wallet: {
              balance: 0,
              currency: getUserCurrency(),
              lastUpdated: 0,
              isLoading: false,
              error: null,
            }
          }), false, 'wallet/clearWalletData');
        },

        // Clear premium data
        clearPremiumData: () => {
          set((state) => ({
            premium: {
              isPremium: false,
              isContentCreatorPremium: false,
              premiumPlanId: 0,
              contentCreatorPlanId: 0,
              premiumExpiresAt: null,
              contentCreatorExpiresAt: null,
              premiumPlanName: null,
              contentCreatorPlanName: null,
              lastUpdated: 0,
              isLoading: false,
              error: null,
            }
          }), false, 'premium/clearPremiumData');
        },

        // Clear errors
        clearError: () => {
          set((state) => ({
            wallet: { ...state.wallet, error: null },
            premium: { ...state.premium, error: null },
          }), false, 'clearError');
        },
      }),
      {
        name: 'enhanced-wallet-premium-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          wallet: {
            balance: state.wallet.balance,
            currency: state.wallet.currency,
            lastUpdated: state.wallet.lastUpdated,
          },
          premium: {
            isPremium: state.premium.isPremium,
            isContentCreatorPremium: state.premium.isContentCreatorPremium,
            premiumPlanId: state.premium.premiumPlanId,
            contentCreatorPlanId: state.premium.contentCreatorPlanId,
            premiumExpiresAt: state.premium.premiumExpiresAt,
            contentCreatorExpiresAt: state.premium.contentCreatorExpiresAt,
            premiumPlanName: state.premium.premiumPlanName,
            contentCreatorPlanName: state.premium.contentCreatorPlanName,
            lastUpdated: state.premium.lastUpdated,
          },
          transactions: state.transactions.slice(0, 20), // Persist only recent transactions
        }),
      }
    ),
    {
      name: 'enhanced-wallet-premium-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Enhanced Selectors for optimized re-renders
export const useEnhancedWalletBalance = () => useEnhancedWalletPremiumStore((state) => state.wallet.balance);
export const useEnhancedWalletState = () => useEnhancedWalletPremiumStore((state) => state.wallet);
export const useEnhancedPremiumState = () => useEnhancedWalletPremiumStore((state) => state.premium);
export const useEnhancedTransactions = () => useEnhancedWalletPremiumStore((state) => state.transactions);

// Enhanced Individual action selectors
export const useEnhancedInitializeWalletData = () => useEnhancedWalletPremiumStore((state) => state.initializeWalletData);
export const useEnhancedInitializePremiumData = () => useEnhancedWalletPremiumStore((state) => state.initializePremiumData);
export const useEnhancedRefreshWalletBalance = () => useEnhancedWalletPremiumStore((state) => state.refreshWalletBalance);
export const useEnhancedRefreshPremiumStatus = () => useEnhancedWalletPremiumStore((state) => state.refreshPremiumStatus);
export const useEnhancedUpdateWalletBalance = () => useEnhancedWalletPremiumStore((state) => state.updateWalletBalance);
export const useEnhancedUpdatePremiumStatus = () => useEnhancedWalletPremiumStore((state) => state.updatePremiumStatus);
export const useEnhancedAddTransaction = () => useEnhancedWalletPremiumStore((state) => state.addTransaction);
export const useEnhancedFormatCurrency = () => useEnhancedWalletPremiumStore((state) => state.formatCurrency);
export const useEnhancedConvertCurrency = () => useEnhancedWalletPremiumStore((state) => state.convertCurrency);
export const useEnhancedFormatCurrencyWithConversion = () => useEnhancedWalletPremiumStore((state) => state.formatCurrencyWithConversion);
export const useEnhancedClearWalletData = () => useEnhancedWalletPremiumStore((state) => state.clearWalletData);
export const useEnhancedClearPremiumData = () => useEnhancedWalletPremiumStore((state) => state.clearPremiumData);
export const useEnhancedClearError = () => useEnhancedWalletPremiumStore((state) => state.clearError);

// Enhanced action hooks
export const useEnhancedWalletActions = () => useEnhancedWalletPremiumStore((state) => ({
  initializeWalletData: state.initializeWalletData,
  refreshWalletBalance: state.refreshWalletBalance,
  updateWalletBalance: state.updateWalletBalance,
  addTransaction: state.addTransaction,
  formatCurrency: state.formatCurrency,
  convertCurrency: state.convertCurrency,
  formatCurrencyWithConversion: state.formatCurrencyWithConversion,
  clearWalletData: state.clearWalletData,
}));

export const useEnhancedPremiumActions = () => useEnhancedWalletPremiumStore((state) => ({
  initializePremiumData: state.initializePremiumData,
  refreshPremiumStatus: state.refreshPremiumStatus,
  updatePremiumStatus: state.updatePremiumStatus,
  clearPremiumData: state.clearPremiumData,
}));

export const useEnhancedWalletPremiumActions = () => useEnhancedWalletPremiumStore((state) => ({
  initializeWalletData: state.initializeWalletData,
  initializePremiumData: state.initializePremiumData,
  refreshWalletBalance: state.refreshWalletBalance,
  refreshPremiumStatus: state.refreshPremiumStatus,
  updateWalletBalance: state.updateWalletBalance,
  updatePremiumStatus: state.updatePremiumStatus,
  addTransaction: state.addTransaction,
  formatCurrency: state.formatCurrency,
  convertCurrency: state.convertCurrency,
  formatCurrencyWithConversion: state.formatCurrencyWithConversion,
  clearWalletData: state.clearWalletData,
  clearPremiumData: state.clearPremiumData,
  clearError: state.clearError,
}));