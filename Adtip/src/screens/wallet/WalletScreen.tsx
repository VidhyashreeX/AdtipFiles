// src/screens/wallet/WalletScreen.tsx
import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWalletBalance, useSubscriptionStatus, useWithdrawalRequests } from '../../hooks/useQueries';
import ApiService from '../../services/ApiService';
import Header from '../../components/common/Header';
import ScreenTransition from '../../components/common/ScreenTransition';
import BalanceCardSkeleton from '../../components/skeletons/BalanceCardSkeleton';
import PlanCardSkeleton from '../../components/skeletons/PlanCardSkeleton';
import TransactionListSkeleton from '../../components/skeletons/TransactionListSkeleton';
import { useWallet } from '../../contexts/WalletContext';
import { useUserDataContext, useUserPremiumStatus, useUserWallet } from '../../contexts/UserDataContext';
import UserPremiumPlans from './UserPremiumPlans';
import WithdrawalForm from '../../components/withdrawal/WithdrawalForm';
import PremiumPopup from '../../components/common/PremiumPopup';
import { queryClient } from '../../providers/QueryProvider';

const WITHDRAWAL_THRESHOLD = {
  REGULAR: 100,
  PREMIUM: 50,
};
const RAZORPAY_KEY_ID = 'your_razorpay_key_id';

const WalletScreen = () => {
  const navigation = useNavigation<any>();
  const {colors, isDarkMode} = useTheme();
  const {user, premiumState, setPremiumState} = useAuth();
  const { refreshBalance } = useWallet();

  // Use new user data context for comprehensive user information
  const { userData, isLoading: userDataLoading, refetch: refetchUserData } = useUserDataContext();
  const { isPremium, premiumExpiresAt } = useUserPremiumStatus();
  const { walletBalance, totalWithdrawals } = useUserWallet();

  // UI states only - data comes from TanStack Query
  const [activeTab, setActiveTab] = useState<'earnings' | 'withdrawals'>('earnings');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isAmountModalVisible, setIsAmountModalVisible] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [isWithdrawalModalVisible, setIsWithdrawalModalVisible] = useState(false);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  
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
  } = useSubscriptionStatus(user?.id || 0);

  const {
    data: withdrawalData,
    isLoading: withdrawalLoading,
    error: withdrawalErrorQuery,
    refetch: refetchWithdrawals,
  } = useWithdrawalRequests(user?.id || 0);



  // Computed values from TanStack Query data (keeping existing for backward compatibility)
  const balance = useMemo(() => {
    // Prefer user data context, fallback to old API
    return walletBalance || balanceData?.availableBalance || 0;
  }, [walletBalance, balanceData]);

  // isPremium is now from user data context
  const withdrawRequests = useMemo(() => {
    return withdrawalData?.data || [];
  }, [withdrawalData]);

  // Computed withdrawal limits and balance
  const minimumWithdrawal = useMemo(() => {
    return isPremium ? WITHDRAWAL_THRESHOLD.PREMIUM : WITHDRAWAL_THRESHOLD.REGULAR;
  }, [isPremium]);

  const currentBalance = useMemo(() => {
    return typeof balance === 'string' ? parseFloat(balance) : (typeof balance === 'number' ? balance : 0);
  }, [balance]);

  const canWithdraw = useMemo(() => {
    return currentBalance >= minimumWithdrawal;
  }, [currentBalance, minimumWithdrawal]);

  // Loading states
  const isInitialLoading = balanceLoading || premiumLoading;
  const isRefreshing = withdrawalLoading;

  // Update AsyncStorage when balance changes
  useEffect(() => {
    if (balanceData?.availableBalance) {
      AsyncStorage.setItem('wallet_balance', String(balanceData.availableBalance));
      setPremiumState(prev => ({ ...prev, walletBalance: String(balanceData.availableBalance) }));
    }
  }, [balanceData]);

  // Effect for tab changes - TanStack Query handles data fetching automatically
  useEffect(() => {
    if (activeTab === 'withdrawals') {
      // TanStack Query will automatically fetch data when the hook is enabled
      console.log('WalletScreen: Switched to withdrawals tab - TanStack Query will handle data fetching');
    }
  }, [activeTab]);

  // Optimized focus effect - TanStack Query handles data fetching automatically
  useFocusEffect(
    useCallback(() => {
      console.log('WalletScreen focused - TanStack Query will handle data refresh');

      // Only invalidate queries on focus for fresh data, don't force refetch
      if (refetchBalance) {
        // Use background refetch to avoid blocking UI
        refetchBalance();
      }

      return () => {
        console.log('WalletScreen unfocused');
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
      };
    }, [refetchBalance])
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
    /*if (!isPremium) {
      setShowPremiumPopup(true);
      return;
    }*/
    if (currentBalance < 1000) {
      Alert.alert('Minimum withdrawal amount is ₹1000 for premium users.');
      return;
    }
    setIsWithdrawalModalVisible(true);
  };

  const handleWithdrawalSuccess = (newBalance?: number) => {
    // If new balance is provided, update immediately for instant feedback
    if (newBalance !== undefined) {
      console.log('💰 [WalletScreen] Immediate balance update:', newBalance);
      
      // Immediately update the local balance state for instant UI feedback
      // This will show the new balance immediately without waiting for server refresh
      if (balanceData) {
        // Update the balance data immediately
        const updatedBalanceData = {
          ...balanceData,
          availableBalance: newBalance.toString()
        };
        
        // Update the query cache immediately using the correct query key
        queryClient.setQueryData(['wallet', 'balance', user?.id], updatedBalanceData);
      }
    }
    
    // Refresh both balance and withdrawals after successful withdrawal
    if (refreshBalance) refreshBalance();
    if (refetchWithdrawals) refetchWithdrawals();
  };



  const renderBalanceCard = () => {
    if (isInitialLoading && balance === '0.00') {
      return <BalanceCardSkeleton />;
    }

    if (balanceErrorQuery) {
      return (
        <View style={[styles.errorCard, {backgroundColor: colors.card}]}>
          <Text style={[styles.errorText, {color: colors.error}]}>Failed to load balance</Text>
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
<View style={styles.withdrawalInfoContainer}>
  <Text style={[styles.withdrawalInfoTitle, { color: colors.text.primary }]}>
    Withdrawal Information
  </Text>

  <View style={styles.withdrawalInfoItem}>
    <Text style={[styles.withdrawalInfoLabel, { color: colors.text.secondary }]}>
      Minimum withdrawal:
    </Text>
    <Text style={[
      styles.withdrawalInfoValue,
      { color: isPremium ? '#4CAF50' : colors.text.primary }
    ]}>
      ₹{isPremium ? '1,000' : '5,000'} {isPremium ? '(Premium)' : '(Non-premium)'}
    </Text>
  </View>

  {isPremium ? (
    <Text style={[styles.withdrawalInfoNote, { color: colors.text.tertiary }]}>
      As a premium user, you enjoy a lower withdrawal minimum of ₹1,000 and faster processing.
    </Text>
  ) : (
    <Text style={[styles.withdrawalInfoNote, { color: colors.text.tertiary }]}>
      Upgrade to{' '}
      <Text
        style={[styles.bold, { color: '#4CAF50' }]}
        onPress={() => navigation.navigate('PremiumUser' as never)}
      >
        Premium
      </Text>{' '}
      to withdraw as little as{' '}
      <Text
        style={[styles.bold, { color: '#4CAF50' }]}
        onPress={() => navigation.navigate('PremiumUser' as never)}
      >
        ₹1,000
      </Text>{' '}
      with faster processing.
    </Text>
  )}
</View>




      </LinearGradient>
    );
  };

  const renderPlanCard = () => {
    if (isInitialLoading && !premiumData) {
      return <PlanCardSkeleton />;
    }

    if (premiumErrorQuery && !premiumErrorQuery.message?.toLowerCase().includes('no active premium plan')) {
      return (
        <View style={[styles.errorCard, {backgroundColor: colors.card}]}>
          <Text style={[styles.errorText, {color: colors.error}]}>Failed to load premium status</Text>
        </View>
      );
    }

    return (
      <UserPremiumPlans isPremiumProp={isPremium} />
    );
  };

  const renderTransactionContent = () => {
    if (activeTab === 'earnings') {
      // For now, show placeholder for earnings since we don't have a specific API
      return <Text style={[styles.emptyText, {color: colors.text.secondary}]}>No earnings to display</Text>;
    } else {
      if (withdrawalLoading && withdrawRequests.length === 0) {
        return <TransactionListSkeleton count={5} />;
      }

      if (withdrawalErrorQuery) {
        return (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, {color: colors.error}]}>Failed to load withdrawals</Text>
            <TouchableOpacity onPress={() => handleRefresh()} style={[styles.retryButton, {borderColor: colors.primary}]}>
              <Text style={[styles.retryButtonText, {color: colors.primary}]}>Retry</Text>
            </TouchableOpacity>
          </View>
        );
      }

      if (withdrawRequests.length === 0 && !withdrawalLoading) {
        return <Text style={[styles.emptyText, {color: colors.text.secondary}]}>No withdrawal requests</Text>;
      }
      
      return withdrawRequests.map((request: any, index: number) => (
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
        <Header
          title="My Wallet"
          showWallet={false}
          showSearch={false}
          showPremium={false}
          leftComponent={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
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

        {/* Withdrawal Form Modal */}
        <WithdrawalForm
          visible={isWithdrawalModalVisible}
          onClose={() => setIsWithdrawalModalVisible(false)}
          onSuccess={handleWithdrawalSuccess}
          withdrawalType="wallet"
          availableBalance={currentBalance}
          userId={user?.id || 0}
        />
        <PremiumPopup
          visible={showPremiumPopup}
          onClose={() => setShowPremiumPopup(false)}
          onUpgrade={() => setShowPremiumPopup(false)}
        />
      </View>
    </ScreenTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bold: {
    fontWeight: 'bold',
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
  withdrawalInfoContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  withdrawalInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  withdrawalInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  withdrawalInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  withdrawalInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  withdrawalInfoNote: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
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
  backButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default React.memo(WalletScreen);