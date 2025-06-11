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
// IMPORTANT: Rename or replace this. WalletBalance is for the main balance card.
// You need a component for individual transaction rows.
import TransactionItemDisplay from '../../components/wallet/WalletBalance'; 
// import ActualTransactionRow from '../../components/wallet/ActualTransactionRow'; // Example

// Skeleton Components
import BalanceCardSkeleton from '../../components/skeletons/BalanceCardSkeleton';
import PlanCardSkeleton from '../../components/skeletons/PlanCardSkeleton';
import TransactionListSkeleton from '../../components/skeletons/TransactionListSkeleton';

// Context and services
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import useWallet from '../../hooks/useWallet';
import ApiService from '../../services/ApiService';
import {ENDPOINTS} from '../../constants/api';

const WITHDRAWAL_THRESHOLD = {
  REGULAR: 100,
  PREMIUM: 50,
};
const RAZORPAY_KEY_ID = 'your_razorpay_key_id'; // Replace with your actual Razorpay key

type WalletStackParamList = {
  WithdrawalForm: {
    balance: number;
    minimumWithdrawal: number;
    onSuccess: () => void;
  };
  Packages: undefined;
};

const WalletScreen = () => {
  const navigation = useNavigation<any>();
  const {colors, isDarkMode} = useTheme();
  const {user} = useAuth();
  
  const {
    balance, 
    transactions, // Earnings transactions from useWallet
    isLoading: isLoadingWalletData, // Covers balance, premium status, earnings
    isRefreshing, 
    refreshWallet,
    isPremium: isUserPremium,
  } = useWallet();
  
  const [activeTab, setActiveTab] = useState<'earnings' | 'withdrawals'>('earnings');
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isAmountModalVisible, setIsAmountModalVisible] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');

  const withdrawalAbortControllerRef = useRef<AbortController | null>(null);
  
  const minimumWithdrawal = isUserPremium 
    ? WITHDRAWAL_THRESHOLD.PREMIUM 
    : WITHDRAWAL_THRESHOLD.REGULAR;
  
  const currentBalance = typeof balance === 'string' ? parseFloat(balance) : (typeof balance === 'number' ? balance : 0);
  const canWithdraw = currentBalance >= minimumWithdrawal;

  const fetchWithdrawalRequestsStable = useCallback(async (signal?: AbortSignal) => {
    if (!user || !user.id) {
      setIsLoadingWithdrawals(false); // Ensure loading is off if no user
      return;
    }

    setIsLoadingWithdrawals(true); // Set loading true at the start of an attempt
    try {
      console.log('API Call: Fetching withdrawal requests...');
      const response = await ApiService.get(`${ENDPOINTS.WITHDRAWAL_REQUESTS}/${user.id}`, { signal });
      
      if (signal?.aborted) {
        console.log('Fetch withdrawal requests aborted during API call.');
        return; // Don't update state if aborted
      }
      setWithdrawRequests(response?.data || []);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch withdrawal requests API call successfully aborted by signal.');
      } else {
        console.error('Error fetching withdrawal requests:', error);
        setWithdrawRequests([]); // Clear on error
      }
    } finally {
      // Only set loading to false if the call wasn't aborted by an unmount/unfocus
      // If signal is present and aborted, it means the abort was intentional before completion.
      if (!(signal?.aborted)) {
         setIsLoadingWithdrawals(false);
      }
    }
  }, [user]); // Stable based on user

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      console.log('WalletScreen focused.');

      if (user && user.id) {
        console.log('WalletScreen Focus: Calling refreshWallet (for balance, premium, earnings).');
        refreshWallet().catch(error => {
          if (isMounted) console.error("Error during refreshWallet on focus:", error);
        });

        // If withdrawals tab is active and we don't have data and not currently loading them, fetch.
        if (activeTab === 'withdrawals' && withdrawRequests.length === 0 && !isLoadingWithdrawals) {
          console.log('WalletScreen Focus: Active withdrawals tab, no data, not loading. Fetching withdrawals.');
          
          if (withdrawalAbortControllerRef.current) {
            withdrawalAbortControllerRef.current.abort(); // Abort previous if any
          }
          withdrawalAbortControllerRef.current = new AbortController();
          
          fetchWithdrawalRequestsStable(withdrawalAbortControllerRef.current.signal)
            .catch(error => {
              if (isMounted && error.name !== 'AbortError') {
                console.error("Error fetching withdrawals on focus:", error);
              }
            });
        }
      }

      return () => {
        console.log('WalletScreen unfocused. Aborting pending withdrawal fetch.');
        isMounted = false;
        if (withdrawalAbortControllerRef.current) {
          withdrawalAbortControllerRef.current.abort();
          withdrawalAbortControllerRef.current = null; // Clear the ref
        }
      };
    }, [user, refreshWallet, activeTab, withdrawRequests.length, isLoadingWithdrawals, fetchWithdrawalRequestsStable])
  );
  
  useEffect(() => {
    let isMounted = true;
    if (user && user.id && activeTab === 'withdrawals') {
      // If tab switched to withdrawals, and no data, and not currently loading: fetch.
      if (withdrawRequests.length === 0 && !isLoadingWithdrawals) {
        console.log('WalletScreen Tab Switch: Active tab is withdrawals, no data, not loading. Fetching.');
        
        if (withdrawalAbortControllerRef.current) {
          withdrawalAbortControllerRef.current.abort(); // Abort previous from focus if any
        }
        withdrawalAbortControllerRef.current = new AbortController();
        
        fetchWithdrawalRequestsStable(withdrawalAbortControllerRef.current.signal)
          .catch(error => {
            if (isMounted && error.name !== 'AbortError') {
              console.error("Error fetching withdrawals on tab switch:", error);
            }
          });
      }
    }
    return () => {
      isMounted = false;
      // No specific abort here, useFocusEffect handles unfocus.
      // If a fetch was started by this effect and tab changes again quickly before focus changes,
      // the new call to fetchWithdrawalRequestsStable would abort the previous one.
    };
  }, [activeTab, user, withdrawRequests.length, isLoadingWithdrawals, fetchWithdrawalRequestsStable]);

  const handleRefresh = useCallback(async () => {
    console.log('WalletScreen: Manual refresh triggered.');
    if (!user || !user.id) return;

    const refreshPromises = [refreshWallet()];

    if (activeTab === 'withdrawals') {
      if (withdrawalAbortControllerRef.current) {
        withdrawalAbortControllerRef.current.abort();
      }
      withdrawalAbortControllerRef.current = new AbortController();
      refreshPromises.push(
        fetchWithdrawalRequestsStable(withdrawalAbortControllerRef.current.signal)
      );
    }
    try {
      await Promise.all(refreshPromises);
    } catch (error) {
      console.error("Error during manual refresh:", error);
    }
  }, [user, refreshWallet, activeTab, fetchWithdrawalRequestsStable]);
  
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
              await refreshWallet(); 
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
        refreshWallet(); // This will re-fetch earnings
        fetchWithdrawalRequests(); // Also re-fetch withdrawals
      }
    });
  };

  const navigateToPremium = () => {
    navigation.navigate('Packages' as never);
  };

  const renderBalanceCard = () => {
    // Show skeleton if useWallet is loading AND balance is still at its initial '0.00' state
    if (isLoadingWalletData && balance === '0.00') {
      return <BalanceCardSkeleton />;
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
    // Show skeleton if useWallet is loading AND premium status is not yet determined
    if (isLoadingWalletData && typeof isUserPremium === 'undefined') {
        return <PlanCardSkeleton />;
    }
    return (
      <View style={[styles.planContainer]}>
        <LinearGradient
          colors={isDarkMode 
            ? isUserPremium ? ['#2C3E50', '#4CA1AF'] : ['#232526', '#414345'] 
            : isUserPremium ? ['#EAFBE3', '#E0F5D9'] : ['#F5F7FA', '#E8EAED']
          }
          style={styles.planCard}
        >
          <View style={styles.planCardHeader}>
            <Icon name="star" size={20} color={isDarkMode ? colors.text.primary : isUserPremium ? "#07BC4C" : "#333"} />
            <Text style={[styles.planTitle, {color: isDarkMode ? colors.text.primary : isUserPremium ? "#07BC4C" : "#333"}]}>
              {isUserPremium ? 'Premium Plan' : 'Standard Plan'}
            </Text>
          </View>
          <Text style={[styles.planExpiry, {color: isDarkMode ? colors.text.secondary : '#666'}]}>
            {isUserPremium ? 'Enjoy exclusive benefits!' : 'Upgrade for more features.'}
          </Text>
          <View style={styles.planStatusContainer}>
            <View style={[styles.planStatusBadge, {backgroundColor: isUserPremium ? (isDarkMode ? colors.success : '#D4EDDA') : (isDarkMode ? colors.gray[600] : colors.gray[200])}]}>
              <Text style={[styles.planStatusText, {color: isUserPremium ? (isDarkMode ? colors.text.primary : colors.successDark) : (isDarkMode ? colors.text.secondary : colors.text.tertiary)}]}>
                {isUserPremium ? 'Active' : 'Inactive'}
              </Text>
            </View>
            {isUserPremium && (
              <Text style={[styles.planActiveText, {color: isDarkMode ? colors.text.secondary : colors.text.tertiary}]}>
                Minimum Withdrawal: ₹{WITHDRAWAL_THRESHOLD.PREMIUM}
              </Text>
            )}
          </View>
          {!isUserPremium && (
            <TouchableOpacity onPress={navigateToPremium} style={styles.upgradeButton}>
              <LinearGradient colors={['#11998e', '#38ef7d']} style={styles.upgradeButtonGradient}>
                <Icon name="zap" size={18} color="#FFF" style={styles.upgradeButtonIcon} />
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={navigateToPremium}
            style={[styles.viewPlansButton, { marginTop: isUserPremium ? 16 : 8 }]}
          >
            <Text style={[styles.viewPlansButtonText, {color: isDarkMode ? colors.primary : '#11998e'}]}>
              {isUserPremium ? 'View Plan Details' : 'View All Plans'}
            </Text>
            <Icon name="chevron-right" size={16} color={isDarkMode ? colors.primary : '#11998e'} style={{marginLeft: 4}} />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  const renderTransactionContent = () => {
    if (activeTab === 'earnings') {
      // Show skeleton if useWallet is loading AND no earnings transactions are loaded yet
      if (isLoadingWalletData && transactions.length === 0) {
        return <TransactionListSkeleton count={5} />;
      }
      if (transactions.length === 0 && !isLoadingWalletData) {
        return <Text style={[styles.emptyText, {color: colors.text.secondary}]}>No earnings to display</Text>;
      }
      return transactions
        .filter(tx => tx.type === 'credit')
        .map((transaction, index) => (
          // Replace TransactionItemDisplay with your actual component for a transaction row
          <TransactionItemDisplay key={`earn-${index}`} transaction={transaction} />
          // <ActualTransactionRow key={`earn-${index}`} transaction={transaction} />
        ));
    } else { // activeTab === 'withdrawals'
      // Show skeleton if withdrawals are loading AND no withdrawal requests are loaded yet
      if (isLoadingWithdrawals && withdrawRequests.length === 0) {
        return <TransactionListSkeleton count={5} />;
      }
      if (withdrawRequests.length === 0 && !isLoadingWithdrawals) {
        return <Text style={[styles.emptyText, {color: colors.text.secondary}]}>No withdrawal requests</Text>;
      }
      return withdrawRequests.map((request, index) => (
        // Replace TransactionItemDisplay with your actual component for a transaction row
        <TransactionItemDisplay key={`withdraw-${index}`} transaction={request} isWithdrawal={true} />
        // <ActualTransactionRow key={`withdraw-${index}`} transaction={request} isWithdrawal={true} />
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
            refreshing={isRefreshing || isLoadingWithdrawals} // Show refresh indicator if either is loading
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
            activeOpacity={1} // Ensure it captures press
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
  // ... (Your existing styles should largely work)
  // Ensure your skeleton components have appropriate dimensions matching your actual cards/rows.
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
    // color will be inherited or can be set if needed
  },
  planContainer: {
    marginHorizontal: 16, 
    marginBottom: 20,
    // backgroundColor applied by skeleton or LinearGradient
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden', // For LinearGradient border radius
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
    elevation: 5, // For Android shadow
    shadowColor: '#000', // For iOS shadow
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