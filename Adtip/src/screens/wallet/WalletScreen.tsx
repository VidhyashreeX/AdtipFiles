// src/screens/wallet/WalletScreen.tsx
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWalletBalance, usePremiumStatus, useWithdrawalRequests } from '../../hooks/useQueries';
import ApiService from '../../services/ApiService';
import Header from '../../components/common/Header';
import ScreenTransition from '../../components/common/ScreenTransition';
import BalanceCardSkeleton from '../../components/skeletons/BalanceCardSkeleton';
import PlanCardSkeleton from '../../components/skeletons/PlanCardSkeleton';
import TransactionListSkeleton from '../../components/skeletons/TransactionListSkeleton';
import { useWallet } from '../../contexts/WalletContext';
import UserPremiumPlans from './UserPremiumPlans';

const WITHDRAWAL_THRESHOLD = {
  REGULAR: 100,
  PREMIUM: 50,
};
const RAZORPAY_KEY_ID = 'your_razorpay_key_id';

const WalletScreen = () => {
  const navigation = useNavigation<any>();
  const {colors, isDarkMode} = useTheme();
  const {user} = useAuth();
  const { refreshBalance } = useWallet();
  
  // Single loading state for all data
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Wallet data states
  const [balance, setBalance] = useState<string>('0.00');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);
  
  // Tab and UI states
  const [activeTab, setActiveTab] = useState<'earnings' | 'withdrawals'>('earnings');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isAmountModalVisible, setIsAmountModalVisible] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');
  
  // Error states
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [withdrawalsError, setWithdrawalsError] = useState<string | null>(null);
  
  // Data fetch status tracking
  const [dataFetched, setDataFetched] = useState({
    balance: false,
    premium: false,
    transactions: false,
    withdrawals: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  
  const minimumWithdrawal = isPremium 
    ? WITHDRAWAL_THRESHOLD.PREMIUM 
    : WITHDRAWAL_THRESHOLD.REGULAR;
  
  const currentBalance = typeof balance === 'string' ? parseFloat(balance) : (typeof balance === 'number' ? balance : 0);
  const canWithdraw = currentBalance >= minimumWithdrawal;

  // TanStack Query hooks for data fetching
  const {
    data: balanceData,
    isLoading: balanceLoading,
    error: balanceErrorQuery,
    refetch: refetchBalance,
  } = useWalletBalance(user?.id || 0);

  const {
    data: premiumData,
    isLoading: premiumLoading,
    error: premiumErrorQuery,
  } = usePremiumStatus(user?.id || 0);

  const {
    data: withdrawalData,
    isLoading: withdrawalLoading,
    error: withdrawalErrorQuery,
    refetch: refetchWithdrawals,
  } = useWithdrawalRequests(user?.id || 0);



  // Update local state when TanStack Query data changes
  useEffect(() => {
    if (balanceData?.availableBalance) {
      setBalance(balanceData.availableBalance);
      setDataFetched(prev => ({ ...prev, balance: true }));
    }
  }, [balanceData]);

  useEffect(() => {
    if (premiumData) {
      // Check if premium is not expired - handle the API response format properly
      const isPremiumActive = !premiumData.is_premium_expired;
      setIsPremium(isPremiumActive);
      setDataFetched(prev => ({ ...prev, premium: true }));
    } else {
      // If no premium data, user is not premium
      setIsPremium(false);
      setDataFetched(prev => ({ ...prev, premium: true }));
    }
  }, [premiumData]);

  useEffect(() => {
    if (withdrawalData?.data) {
      setWithdrawRequests(withdrawalData.data);
      setDataFetched(prev => ({ ...prev, withdrawals: true }));
    }
  }, [withdrawalData]);

  // Handle errors from TanStack Query
  useEffect(() => {
    if (balanceErrorQuery) {
      setBalanceError('Failed to load balance');
    }
  }, [balanceErrorQuery]);

  useEffect(() => {
    if (premiumErrorQuery) {
      // Only set error for actual network errors, not for "No active premium plan" responses
      const errorMessage = premiumErrorQuery?.message || '';
      if (errorMessage.toLowerCase().includes('no active premium plan')) {
        // This is a valid response indicating no premium, not an error
        setPremiumError(null);
      } else {
        setPremiumError('Failed to load premium status');
      }
    } else {
      // Clear error when there's no error
      setPremiumError(null);
    }
  }, [premiumErrorQuery]);

  // Also clear premium error when premium data is successfully loaded
  useEffect(() => {
    if (premiumData) {
      // Clear any premium error when we have successful data
      setPremiumError(null);
    }
  }, [premiumData]);

  useEffect(() => {
    if (withdrawalErrorQuery) {
      setWithdrawalsError('Failed to load withdrawals');
    }
  }, [withdrawalErrorQuery]);

  // Update loading states
  useEffect(() => {
    setIsInitialLoading(balanceLoading || premiumLoading);
  }, [balanceLoading, premiumLoading]);

  useEffect(() => {
    setIsRefreshing(withdrawalLoading);
  }, [withdrawalLoading]);

  // Fetch withdrawals when tab changes to withdrawals (only if not already fetched)
  const fetchWithdrawalsOnTabChange = useCallback(async () => {
    if (!user || !user.id || dataFetched.withdrawals) {
      return;
    }

    console.log('WalletScreen: Fetching withdrawals for tab change');
    
    try {
      setWithdrawalsError(null);
      const response = await ApiService.get(`/api/withdrawal-requests/${user.id}`);
      setWithdrawRequests(response?.data || []);
      setDataFetched(prev => ({ ...prev, withdrawals: true }));
    } catch (error: any) {
      console.error('WalletScreen: Error fetching withdrawals on tab change:', error);
      setWithdrawalsError('Failed to load withdrawals');
    }
  }, [user, dataFetched.withdrawals]);

  // Effect for tab changes
  useEffect(() => {
    if (activeTab === 'withdrawals') {
      fetchWithdrawalsOnTabChange();
    }
  }, [activeTab, fetchWithdrawalsOnTabChange]);

  // Focus effect - only fetch if no data has been fetched yet
  useEffect(() => {
    if (refreshBalance) refreshBalance();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (refreshBalance) refreshBalance();
      console.log('WalletScreen focused');

      return () => {
        console.log('WalletScreen unfocused');
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
      };
    }, [refreshBalance])
  );

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    if (refreshBalance) await refreshBalance();
    if (refetchWithdrawals) await refetchWithdrawals();
    console.log('WalletScreen: Manual refresh triggered');
  }, [refreshBalance, refetchWithdrawals]);

  const handleAddMoney = () => {
    navigation.navigate('AddFundsScreen');
  };

  const handleWithdraw = () => {
    if (!canWithdraw) {
      Alert.alert(
        'Cannot Withdraw', 
        `Minimum withdrawal amount is ₹${minimumWithdrawal}`
      );
      return;
    }
    
    navigation.navigate('WithdrawalForm' as never, { 
      balance: currentBalance,
      minimumWithdrawal,
      onSuccess: () => {
        // Refresh both balance and withdrawals after successful withdrawal
        if (refreshBalance) refreshBalance();
        if (refetchWithdrawals) refetchWithdrawals();
      }
    });
  };

  const navigateToPremium = () => {
    navigation.navigate('Packages' as never);
  };

  const renderBalanceCard = () => {
    if (isInitialLoading && balance === '0.00') {
      return <BalanceCardSkeleton />;
    }

    if (balanceError) {
      return (
        <View style={[styles.errorCard, {backgroundColor: colors.card}]}>
          <Text style={[styles.errorText, {color: colors.error}]}>{balanceError}</Text>
          <TouchableOpacity onPress={() => handleRefresh()} style={[styles.retryButton, {borderColor: colors.primary}]}>
            <Text style={[styles.retryButtonText, {color: colors.primary}]}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <LinearGradient
        colors={isDarkMode ? ['#4A00E0', '#8E2DE2'] : ['#C1FFA1', '#A1FFA1']} 
        style={styles.balanceCard}>
        <Text style={[styles.balanceLabel, {color: isDarkMode ? colors.text.primary : '#333'}]}>Total Balance</Text>
        <View style={styles.balanceRow}>
          <Text style={[styles.balanceValue, {color: isDarkMode ? colors.text.primary : '#333'}]}>
            ₹{balance}
          </Text>
          <Text style={[styles.currencyLabel, {color: isDarkMode ? colors.text.primary : '#333'}]}>INR</Text>
        </View>
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.addMoneyButton, {backgroundColor: isDarkMode ? colors.primary : '#FFFFFF'}]}
            onPress={handleAddMoney}
            disabled={isProcessingPayment}>
            {isProcessingPayment ? <ActivityIndicator color={isDarkMode ? '#FFFFFF' : colors.primary} /> : <Text style={[styles.addMoneyButtonText, {color: isDarkMode ? '#FFFFFF' : colors.primary}]}>Add Money</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.withdrawButton,
              {backgroundColor: isDarkMode ? colors.surface : '#222222'},
              !canWithdraw && styles.disabledButton
            ]}
            onPress={handleWithdraw}
            disabled={!canWithdraw || isProcessingPayment}>
            <Text style={[styles.withdrawButtonText, {color: '#FFFFFF'}, !canWithdraw && styles.disabledButtonText]}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  };

  const renderPlanCard = () => {
    if (isInitialLoading && !dataFetched.premium) {
      return <PlanCardSkeleton />;
    }

    if (premiumError) {
      return (
        <View style={[styles.errorCard, {backgroundColor: colors.card}]}>
          <Text style={[styles.errorText, {color: colors.error}]}>{premiumError}</Text>
        </View>
      );
    }

    return (
      <UserPremiumPlans isPremiumProp={isPremium} />
    );
  };

  const renderTransactionContent = () => {
    if (activeTab === 'earnings') {
      if (isInitialLoading && transactions.length === 0) {
        return <TransactionListSkeleton count={5} />;
      }
      
      if (transactionsError) {
        return (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, {color: colors.error}]}>{transactionsError}</Text>
            <TouchableOpacity onPress={() => handleRefresh()} style={[styles.retryButton, {borderColor: colors.primary}]}>
              <Text style={[styles.retryButtonText, {color: colors.primary}]}>Retry</Text>
            </TouchableOpacity>
          </View>
        );
      }
      
      if (transactions.length === 0 && dataFetched.transactions) {
        return <Text style={[styles.emptyText, {color: colors.text.secondary}]}>No earnings to display</Text>;
      }
      
      return transactions
        .filter(tx => tx.type === 'credit')
        .map((transaction, index) => (
          <View key={`earn-${index}`} style={{padding: 12, borderBottomWidth: 1, borderColor: '#eee'}}>
            <Text style={{fontWeight: 'bold'}}>+₹{transaction.amount}</Text>
            <Text>{transaction.description || transaction.type}</Text>
            <Text style={{fontSize: 12, color: '#888'}}>{transaction.date}</Text>
          </View>
        ));
    } else {
      if (!dataFetched.withdrawals && withdrawRequests.length === 0) {
        return <TransactionListSkeleton count={5} />;
      }
      
      if (withdrawalsError) {
        return (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, {color: colors.error}]}>{withdrawalsError}</Text>
            <TouchableOpacity onPress={() => fetchWithdrawalsOnTabChange()} style={[styles.retryButton, {borderColor: colors.primary}]}>
              <Text style={[styles.retryButtonText, {color: colors.primary}]}>Retry</Text>
            </TouchableOpacity>
          </View>
        );
      }
      
      if (withdrawRequests.length === 0 && dataFetched.withdrawals) {
        return <Text style={[styles.emptyText, {color: colors.text.secondary}]}>No withdrawal requests</Text>;
      }
      
      return withdrawRequests.map((request, index) => (
        <View key={`withdraw-${index}`} style={{padding: 12, borderBottomWidth: 1, borderColor: '#eee'}}>
          <Text style={{fontWeight: 'bold'}}>-₹{request.amount}</Text>
          <Text>{request.description || 'Withdrawal'}</Text>
          <Text style={{fontSize: 12, color: '#888'}}>{request.date}</Text>
        </View>
      ));
    }
  };

  return (
    <ScreenTransition animationType="scale">
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="My Wallet"
        showWallet = {false}
        showSearch = {false} />
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }>
          
          {renderBalanceCard()}
          {renderPlanCard()}

          <View style={styles.transactionsContainer}>
            <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
              Recent Transactions
            </Text>
            <View style={[styles.tabsContainer, {borderBottomColor: colors.border}]}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'earnings' && [styles.activeTab, {borderBottomColor: colors.primary}]]}
                onPress={() => setActiveTab('earnings')}>
                <Text style={[styles.tabText, {color: activeTab === 'earnings' ? colors.primary : colors.text.secondary}]}>Earnings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'withdrawals' && [styles.activeTab, {borderBottomColor: colors.primary}]]}
                onPress={() => setActiveTab('withdrawals')}>
                <Text style={[styles.tabText, {color: activeTab === 'withdrawals' ? colors.primary : colors.text.secondary}]}>Withdrawals</Text>
              </TouchableOpacity>
            </View>
            
            {renderTransactionContent()}

            {activeTab === 'withdrawals' && (
               <Text style={[styles.withdrawInfo, {color: colors.text.tertiary}]}>
                  Minimum withdrawal: ₹{minimumWithdrawal}. Processing takes 3-5 business days.
               </Text>
            )}
          </View>
        </ScrollView>

        {/* Modal for Adding Funds */}
        <Modal
          transparent={true}
          visible={isAmountModalVisible}
          animationType="slide"
          onRequestClose={() => setIsAmountModalVisible(false)}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              onPress={() => setIsAmountModalVisible(false)}
              activeOpacity={1}
            />
            <LinearGradient
              colors={isDarkMode ? [colors.surface, colors.background] : ['#E0EAFC', '#CFDEF3']}
              style={[styles.modalContent]}>
              <Text style={[styles.modalTitle, {color: colors.text.primary}]}>Add Funds</Text>
              <TextInput
                style={[
                  styles.amountInput,
                  {
                    color: colors.text.primary,
                    borderColor: colors.border,
                    backgroundColor: isDarkMode ? colors.background : '#FFF',
                  },
                ]}
                placeholder="Enter amount (e.g., 500)"
                placeholderTextColor={colors.text.secondary}
                keyboardType="numeric"
                value={amountToAdd}
                onChangeText={setAmountToAdd}
                autoFocus
              />
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, {backgroundColor: colors.border}]}
                  onPress={() => setIsAmountModalVisible(false)}>
                  <Text style={[styles.modalButtonText, {color: colors.text.secondary}]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, {backgroundColor: colors.primary}]}
                  onPress={() => setIsAmountModalVisible(false)}>
                  <Text style={[styles.modalButtonText, {color: '#FFFFFF'}]}>Proceed</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </ScreenTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 90 : 70, 
  },
  balanceCard: {
    padding: 20,
    borderRadius: 16, 
    marginHorizontal: 16, 
    marginTop: 16, 
    marginBottom: 20, 
    elevation: 4, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, 
    shadowRadius: 5, 
  },
  balanceLabel: {
    fontSize: 16, 
    fontWeight: '500', 
    marginBottom: 6, 
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end', 
    marginBottom: 18, 
  },
  balanceValue: {
    fontSize: 36, 
    fontWeight: 'bold',
  },
  currencyLabel: {
    fontSize: 18, 
    fontWeight: '500',
    marginLeft: 8,
    marginBottom: 4, 
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    marginTop: 20, 
  },
  actionButton: {
    flex: 1, 
    borderRadius: 10, 
    paddingVertical: 14, 
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 44, 
  },
  addMoneyButton: {
    marginRight: 8, 
  },
  addMoneyButtonText: {
    fontSize: 15, 
    fontWeight: '600',
  },
  withdrawButton: {
    marginLeft: 8, 
  },
  withdrawButtonText: {
    fontSize: 15, 
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6, 
  },
  disabledButtonText: {
    opacity: 0.6,
  },
  planContainer: {
    marginHorizontal: 16, 
    marginBottom: 20,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6, 
  },
  planTitle: {
    fontSize: 17, 
    fontWeight: '700',
    marginLeft: 10, 
  },
  planExpiry: {
    fontSize: 13, 
    marginTop: 4, 
    marginBottom: 12, 
  },
  planStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, 
  },
  planStatusBadge: {
    paddingVertical: 5, 
    paddingHorizontal: 12, 
    borderRadius: 16, 
    marginRight: 10,
  },
  planStatusText: {
    fontSize: 13, 
    fontWeight: '600',
  },
  planActiveText: {
    fontSize: 13,
    fontWeight: '500', 
  },
  upgradeButton: {
    marginTop: 16,
    borderRadius: 10, 
    overflow: 'hidden',
    elevation: 2,
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12, 
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  upgradeButtonIcon: {
    marginRight: 10, 
  },
  upgradeButtonText: {
    color: '#FFF',
    fontSize: 15, 
    fontWeight: '600', 
  },
  viewPlansButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8, 
  },
  viewPlansButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsContainer: {
    marginHorizontal: 16, 
    marginVertical: 16, 
  },
  sectionTitle: {
    fontSize: 17, 
    fontWeight: '600',
    marginBottom: 12, 
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 12, 
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10, 
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTab: {
    borderBottomWidth: 2.5, 
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15, 
    paddingVertical: 30, 
  },
  withdrawInfo: {
    marginTop: 16, 
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 10, 
  },
  errorCard: {
    padding: 20,
    borderRadius: 16, 
    marginHorizontal: 16, 
    marginTop: 16, 
    marginBottom: 20,
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', 
  },
  modalContent: {
    width: '90%',
    padding: 24, 
    borderRadius: 16, 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18, 
    fontWeight: 'bold',
    marginBottom: 16, 
    textAlign: 'center',
  },
  amountInput: {
    height: 48, 
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 24, 
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10, 
    alignItems: 'center',
    marginHorizontal: 6, 
  },
  modalButtonText: {
    fontSize: 15, 
    fontWeight: '600',
  },
});

export default React.memo(WalletScreen);