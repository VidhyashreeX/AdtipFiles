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

// Components
import Header from '../../components/common/Header';
import TransactionItemDisplay from '../../components/wallet/WalletBalance'; 

// Skeleton Components
import BalanceCardSkeleton from '../../components/skeletons/BalanceCardSkeleton';
import PlanCardSkeleton from '../../components/skeletons/PlanCardSkeleton';
import TransactionListSkeleton from '../../components/skeletons/TransactionListSkeleton';

// Context and services
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import WalletService from '../../services/WalletService';
import {ENDPOINTS} from '../../constants/api';

const WITHDRAWAL_THRESHOLD = {
  REGULAR: 100,
  PREMIUM: 50,
};
const RAZORPAY_KEY_ID = 'your_razorpay_key_id';

const WalletScreen = () => {
  const navigation = useNavigation<any>();
  const {colors, isDarkMode} = useTheme();
  const {user} = useAuth();
  
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

  // Single coordinated fetch function
  const fetchAllWalletData = useCallback(async (isRefresh = false) => {
    if (!user || !user.id) {
      console.log('WalletScreen: No user, skipping data fetch');
      setIsInitialLoading(false);
      setIsRefreshing(false);
      return;
    }

    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }

    console.log(`WalletScreen: ${isRefresh ? 'Refreshing' : 'Initial loading'} wallet data`);

    try {
      // Reset error states
      setBalanceError(null);
      setPremiumError(null);
      setTransactionsError(null);
      setWithdrawalsError(null);

      // Create array of promises for parallel execution
      const promises: Promise<any>[] = [];
      const promiseMap: string[] = [];

      // Only fetch data that hasn't been fetched yet (unless it's a refresh)
      if (!dataFetched.balance || isRefresh) {
        promises.push(WalletService.getWalletBalance(user.id));
        promiseMap.push('balance');
      }

      if (!dataFetched.premium || isRefresh) {
        promises.push(WalletService.checkPremiumStatus(user.id));
        promiseMap.push('premium');
      }

      if (!dataFetched.transactions || isRefresh) {
        promises.push(WalletService.getTransactionHistory(user.id));
        promiseMap.push('transactions');
      }

      if ((!dataFetched.withdrawals || isRefresh) && activeTab === 'withdrawals') {
        promises.push(
          ApiService.get(`${ENDPOINTS.WITHDRAWAL_REQUESTS}/${user.id}`, undefined, { signal })
        );
        promiseMap.push('withdrawals');
      }

      // Execute all promises with allSettled to handle individual failures
      const results = await Promise.allSettled(promises);

      // Process results individually
      results.forEach((result, index) => {
        const dataType = promiseMap[index];
        
        if (signal.aborted) {
          console.log('WalletScreen: Request aborted during processing');
          return;
        }

        if (result.status === 'fulfilled') {
          switch (dataType) {
            case 'balance':
              setBalance(result.value);
              setDataFetched(prev => ({ ...prev, balance: true }));
              console.log('WalletScreen: Balance fetched successfully');
              break;
            
            case 'premium':
              setIsPremium(result.value.isPremium);
              setDataFetched(prev => ({ ...prev, premium: true }));
              console.log('WalletScreen: Premium status fetched successfully');
              break;
            
            case 'transactions':
              setTransactions(result.value);
              setDataFetched(prev => ({ ...prev, transactions: true }));
              console.log('WalletScreen: Transactions fetched successfully');
              break;
            
            case 'withdrawals':
              setWithdrawRequests(result.value?.data || []);
              setDataFetched(prev => ({ ...prev, withdrawals: true }));
              console.log('WalletScreen: Withdrawals fetched successfully');
              break;
          }
        } else {
          // Handle individual API failures
          console.error(`WalletScreen: ${dataType} fetch failed:`, result.reason);
          
          switch (dataType) {
            case 'balance':
              setBalanceError('Failed to load balance');
              break;
            case 'premium':
              setPremiumError('Failed to load premium status');
              break;
            case 'transactions':
              setTransactionsError('Failed to load transactions');
              break;
            case 'withdrawals':
              setWithdrawalsError('Failed to load withdrawals');
              break;
          }
        }
      });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('WalletScreen: Unexpected error during data fetch:', error);
      }
    } finally {
      if (!signal.aborted) {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [user, activeTab, dataFetched]);

  // Fetch withdrawals when tab changes to withdrawals (only if not already fetched)
  const fetchWithdrawalsOnTabChange = useCallback(async () => {
    if (!user || !user.id || dataFetched.withdrawals) {
      return;
    }

    console.log('WalletScreen: Fetching withdrawals for tab change');
    
    try {
      setWithdrawalsError(null);
      const response = await ApiService.get(`${ENDPOINTS.WITHDRAWAL_REQUESTS}/${user.id}`);
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
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      console.log('WalletScreen focused');

      // Only fetch if we haven't fetched any data yet
      const hasAnyData = Object.values(dataFetched).some(fetched => fetched);
      
      if (!hasAnyData) {
        console.log('WalletScreen: No data fetched yet, initiating fetch');
        fetchAllWalletData(false).catch(error => {
          if (isMounted) {
            console.error('WalletScreen: Error during focus fetch:', error);
          }
        });
      } else {
        console.log('WalletScreen: Data already fetched, skipping fetch');
        setIsInitialLoading(false);
      }

      return () => {
        console.log('WalletScreen unfocused');
        isMounted = false;
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
      };
    }, [fetchAllWalletData, dataFetched])
  );

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    console.log('WalletScreen: Manual refresh triggered');
    if (!user || !user.id) return;

    // Reset data fetched status for refresh
    setDataFetched({
      balance: false,
      premium: false,
      transactions: false,
      withdrawals: false,
    });

    await fetchAllWalletData(true);
  }, [user, fetchAllWalletData]);

  const openAmountModal = () => {
    setAmountToAdd('');
    setIsAmountModalVisible(true);
  };

  const handleProceedWithAmount = () => {
    const numericAmount = parseFloat(amountToAdd);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to add.');
      return;
    }
    if (numericAmount < 10) {
      Alert.alert('Invalid Amount', 'Minimum amount to add is ₹10.');
      return;
    }
    setIsAmountModalVisible(false);
    initiateRazorpayPayment(numericAmount);
  };

  const initiateRazorpayPayment = async (amount: number) => {
    if (!user || !user.id) {
      Alert.alert('Error', 'User information not available. Please try again.');
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      const orderPayload = {
        amount: amount, 
        currency: 'INR',
        userId: user.id,
      };
      const orderData = await ApiService.createRazorpayOrder(orderPayload);

      if (!orderData || !orderData.order_id) {
        throw new Error('Failed to create payment order. No order_id received.');
      }

      const options = {
        description: 'Add funds to Adtip wallet',
        image: 'https://your-app-icon-url.png', 
        currency: orderData.currency || 'INR',
        key: RAZORPAY_KEY_ID, 
        amount: orderData.amount,
        name: 'Adtip',
        order_id: orderData.order_id,
        prefill: {
          email: user?.emailId || '',
          contact: user?.mobile_number || '', 
          name: user?.name || '',
        },
        theme: {color: colors.primary}
      };
      
      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          try {
            const verificationPayload = {
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_order_id: data.razorpay_order_id,
              razorpay_signature: data.razorpay_signature,
              amount: amount, 
              userId: user.id,
            };
            const verificationResponse = await ApiService.verifyRazorpayPayment(verificationPayload);

            if (verificationResponse && verificationResponse.status === 'success') {
              // Refresh only balance after successful payment
              setDataFetched(prev => ({ ...prev, balance: false }));
              await fetchAllWalletData(true);
              Alert.alert('Success', verificationResponse.message || `Added ₹${amount} to your wallet.`);
            } else {
              Alert.alert('Payment Verification Failed', verificationResponse.message || 'Could not verify the payment. Please contact support.');
            }
          } catch (verificationError: any) {
            console.error('Payment verification error:', verificationError);
            Alert.alert('Payment Verification Error', verificationError.message || 'An error occurred while verifying your payment.');
          } finally {
            setIsProcessingPayment(false);
          }
        })
        .catch((error: any) => {
          console.error('Razorpay Checkout error:', error);
          let errorMessage = 'Payment failed. Please try again.';
          if (error.code === 2) errorMessage = 'Payment cancelled.';
          else if (error.description) errorMessage = error.description;
          Alert.alert('Payment Error', errorMessage);
          setIsProcessingPayment(false);
        });
    } catch (err: any) {
      console.error('Order creation or processing error:', err);
      Alert.alert('Error', err.message || 'Failed to initialize payment process.');
      setIsProcessingPayment(false);
    }
  };
  
  const handleAddMoney = () => {
    openAmountModal();
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
        setDataFetched(prev => ({ ...prev, balance: false, withdrawals: false }));
        fetchAllWalletData(true);
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
      <View style={[styles.planContainer]}>
        <LinearGradient
          colors={isDarkMode 
            ? isPremium ? ['#2C3E50', '#4CA1AF'] : ['#232526', '#414345'] 
            : isPremium ? ['#EAFBE3', '#E0F5D9'] : ['#F5F7FA', '#E8EAED']
          }
          style={styles.planCard}
        >
          <View style={styles.planCardHeader}>
            <Icon name="star" size={20} color={isDarkMode ? colors.text.primary : isPremium ? "#07BC4C" : "#333"} />
            <Text style={[styles.planTitle, {color: isDarkMode ? colors.text.primary : isPremium ? "#07BC4C" : "#333"}]}>
              {isPremium ? 'Premium Plan' : 'Standard Plan'}
            </Text>
          </View>
          <Text style={[styles.planExpiry, {color: isDarkMode ? colors.text.secondary : '#666'}]}>
            {isPremium ? 'Enjoy exclusive benefits!' : 'Upgrade for more features.'}
          </Text>
          <View style={styles.planStatusContainer}>
            <View style={[styles.planStatusBadge, {backgroundColor: isPremium ? (isDarkMode ? colors.success : '#D4EDDA') : (isDarkMode ? colors.gray[600] : colors.gray[200])}]}>
              <Text style={[styles.planStatusText, {color: isPremium ? (isDarkMode ? colors.text.primary : colors.successDark) : (isDarkMode ? colors.text.secondary : colors.text.tertiary)}]}>
                {isPremium ? 'Active' : 'Inactive'}
              </Text>
            </View>
            {isPremium && (
              <Text style={[styles.planActiveText, {color: isDarkMode ? colors.text.secondary : colors.text.tertiary}]}>
                Minimum Withdrawal: ₹{WITHDRAWAL_THRESHOLD.PREMIUM}
              </Text>
            )}
          </View>
          {!isPremium && (
            <TouchableOpacity onPress={navigateToPremium} style={styles.upgradeButton}>
              <LinearGradient colors={['#11998e', '#38ef7d']} style={styles.upgradeButtonGradient}>
                <Icon name="zap" size={18} color="#FFF" style={styles.upgradeButtonIcon} />
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={navigateToPremium}
            style={[styles.viewPlansButton, { marginTop: isPremium ? 16 : 8 }]}
          >
            <Text style={[styles.viewPlansButtonText, {color: isDarkMode ? colors.primary : '#11998e'}]}>
              {isPremium ? 'View Plan Details' : 'View All Plans'}
            </Text>
            <Icon name="chevron-right" size={16} color={isDarkMode ? colors.primary : '#11998e'} style={{marginLeft: 4}} />
          </TouchableOpacity>
        </LinearGradient>
      </View>
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
          <TransactionItemDisplay key={`earn-${index}`} transaction={transaction} />
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
        <TransactionItemDisplay key={`withdraw-${index}`} transaction={request} isWithdrawal={true} />
      ));
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="My Wallet" />
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
                  backgroundColor: isDarkMode ? colors.inputBackground : '#FFF',
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
                onPress={handleProceedWithAmount}>
                <Text style={[styles.modalButtonText, {color: '#FFFFFF'}]}>Proceed</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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