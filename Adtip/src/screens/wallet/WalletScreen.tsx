// src/screens/wallet/WalletScreen.tsx
import React, {useState, useEffect} from 'react';
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
  Modal, // Added Modal
  TextInput, // Added TextInput
  KeyboardAvoidingView, // Added for better modal input handling
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

// Components
import Header from '../../components/common/Header';

// Context and services
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import RewardService from '../../services/RewardService';
import useWallet from '../../hooks/useWallet';
import ApiService from '../../services/ApiService';
import {ENDPOINTS} from '../../constants/api';

// For Razorpay
import RazorpayCheckout from 'react-native-razorpay';

type WalletStackParamList = {
  Packages: undefined;
  // add other routes if needed
};

// Withdrawal minimum thresholds
const WITHDRAWAL_THRESHOLD = {
  PREMIUM: 1000,  // ₹1000 for premium users
  REGULAR: 5000,  // ₹5000 for regular users
};

// IMPORTANT: Replace with your actual Razorpay Key ID, preferably from a config file or environment variable
const RAZORPAY_KEY_ID = 'rzp_test_YOUR_KEY_ID'; // Replace this!


const WalletScreen = () => {
  const navigation = useNavigation<NavigationProp<WalletStackParamList>>();
  const {colors, isDarkMode} = useTheme();
  const {user} = useAuth();
  
  const {
    balance, 
    transactions, 
    isLoading, 
    isRefreshing, 
    refreshWallet,
    isPremium: isUserPremium, // Use isPremium from useWallet hook
  } = useWallet();
  
  const [activeTab, setActiveTab] = useState('earnings');
  const [withdrawRequests, setWithdrawRequests] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // State for the amount input modal
  const [isAmountModalVisible, setIsAmountModalVisible] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');
  
  // const isPremium = user?.is_premium === 1; // Replaced by isUserPremium from useWallet
  const minimumWithdrawal = isUserPremium 
    ? WITHDRAWAL_THRESHOLD.PREMIUM 
    : WITHDRAWAL_THRESHOLD.REGULAR;
  
  const currentBalance = typeof balance === 'string' ? parseFloat(balance) : (typeof balance === 'number' ? balance : 0);
  const canWithdraw = currentBalance >= minimumWithdrawal;

  const openAmountModal = () => {
    setAmountToAdd(''); // Reset amount when opening
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

    setIsAmountModalVisible(false); // Close modal
    // Proceed with Razorpay payment
    initiateRazorpayPayment(numericAmount);
  };

  const initiateRazorpayPayment = async (amount: number) => {
    if (!user || !user.id) {
      Alert.alert('Error', 'User information not available. Please try again.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const orderPayload = { // Defined based on previous context
        amount: amount, 
        currency: 'INR',
        userId: user.id,
      };
      // Assuming ApiService.createRazorpayOrder exists and is correctly typed
      const orderData = await ApiService.createRazorpayOrder(orderPayload);

      if (!orderData || !orderData.order_id) {
        throw new Error('Failed to create payment order. No order_id received.');
      }

      const options = {
        description: 'Add funds to Adtip wallet',
        image: 'https://your-app-icon-url.png', 
        currency: orderData.currency || 'INR',
        key: RAZORPAY_KEY_ID, 
        amount: orderData.amount, // Amount in paise from backend
        name: 'Adtip',
        order_id: orderData.order_id,
        prefill: {
          email: user?.email || '',
          contact: user?.mobile_number || '', 
          name: user?.name || '',
        },
        theme: {color: colors.primary}
      };
      
      RazorpayCheckout.open(options)
        .then(async (data) => {
          try {
            const verificationPayload = { // Defined based on previous context
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_order_id: data.razorpay_order_id,
              razorpay_signature: data.razorpay_signature,
              amount: amount, 
              userId: user.id,
            };
            // Assuming ApiService.verifyRazorpayPayment exists
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
            setIsProcessing(false);
          }
        })
        .catch(error => {
          console.error('Razorpay Checkout error:', error);
          let errorMessage = 'Payment failed. Please try again.';
          if (error.code === 2) errorMessage = 'Payment cancelled.';
          else if (error.description) errorMessage = error.description;
          Alert.alert('Payment Error', errorMessage);
          setIsProcessing(false);
        });
    } catch (err: any) {
      console.error('Order creation or processing error:', err);
      Alert.alert('Error', err.message || 'Failed to initialize payment process.');
      setIsProcessing(false);
    }
  };
  
  // The handleAddMoney function now just opens the modal
  const handleAddMoney = () => {
    openAmountModal();
  };

  // Handle withdrawal
  const handleWithdraw = () => {
    if (!canWithdraw) {
      Alert.alert(
        'Cannot Withdraw', 
        `Minimum withdrawal amount is ₹${minimumWithdrawal}`
      );
      return;
    }

    setIsProcessing(true);
    
    navigation.navigate('WithdrawalForm' as never, { // Type assertion if 'WithdrawalForm' is not in WalletStackParamList
      balance: currentBalance,
      minimumWithdrawal,
      onSuccess: () => {
        refreshWallet();
      }
    });
    
    // setIsProcessing(false); // Should be set to false after navigation or if form is modal
  };

  // Fetch withdrawal requests
  useEffect(() => {
    if (user && activeTab === 'withdrawals') {
      ApiService.get(ENDPOINTS.WITHDRAWAL_REQUESTS)
        .then(response => {
          if (response?.data) {
            setWithdrawRequests(response.data);
          }
        })
        .catch(error => {
          console.error('Error fetching withdrawal requests:', error);
        });
    }
  }, [activeTab, user]);

  // Render loading state
  if (isLoading && !isRefreshing && !balance) { // Added !balance to ensure initial loading shows
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="Wallet"/>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.text.primary}]}>
            Loading wallet data...
          </Text>
        </View>
      </View>
    );
  }

  // Handle navigation to packages/premium screen
  const navigateToPremium = () => {
    navigation.navigate('Packages' as never);
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header 
        title="My Wallet" 
        // Removed rightIcon and onRightIconPress for refresh
      />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshWallet}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* Balance Card */}
        <LinearGradient
          colors={isDarkMode ? ['#4A00E0', '#8E2DE2'] : ['#C1FFA1', '#A1FFA1']} 
          style={styles.balanceCard}>
          <Text style={[styles.balanceLabel, {color: isDarkMode ? colors.text.primary : '#333'}]}>Total Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceValue, {color: isDarkMode ? colors.text.primary : '#333'}]}>
              {currentBalance.toFixed(2)}
            </Text>
            <Text style={[styles.currencyLabel, {color: isDarkMode ? colors.text.primary : '#333'}]}>INR</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.addMoneyButton, {backgroundColor: isDarkMode ? colors.primary : '#FFFFFF'}]}
              onPress={handleAddMoney}
              disabled={isProcessing}>
              {isProcessing && activeTab === 'addMoneyProcess' ? (
                <ActivityIndicator size="small" color={isDarkMode ? colors.text.primary : "#333"} />
              ) : (
                <Text style={[styles.addMoneyButtonText, {color: isDarkMode ? colors.text.primary : '#333'}]}>Add Money</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton, 
                styles.withdrawButton,
                {backgroundColor: isDarkMode ? colors.surface : '#222222'},
                !canWithdraw && styles.disabledButton
              ]}
              onPress={handleWithdraw}
              disabled={!canWithdraw || (isProcessing && activeTab === 'withdrawProcess')}>
              <Text 
                style={[
                  styles.withdrawButtonText,
                  {color: isDarkMode ? colors.text.primary : '#FFFFFF'},
                  !canWithdraw && styles.disabledButtonText
                ]}>
                Withdraw
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Subscription Plan Cards - Enhanced Version */}
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
              <Text style={[styles.planTitle, {color: isDarkMode ? colors.text.primary : '#333'}]}>
                {isUserPremium ? 'Premium' : 'Basic'} Plan
              </Text>
            </View>
            
            <Text style={[styles.planExpiry, {color: isDarkMode ? colors.text.secondary : '#666'}]}>
              {isUserPremium 
                ? `Expires: ${user?.subscription_expires_at || 'Not available'}` 
                : 'Upgrade to premium for extra benefits'}
            </Text>
            
            <View style={styles.planStatusContainer}>
              <View style={[styles.planStatusBadge, {
                backgroundColor: isDarkMode 
                  ? colors.background 
                  : isUserPremium ? '#E1FFE4' : '#FFFFFF'
              }]}>
                <Text style={[styles.planStatusText, {color: isDarkMode ? colors.text.primary : '#333'}]}>
                  {isUserPremium ? 'Premium' : 'Free'}
                </Text>
              </View>
              
              <Text 
                style={[
                  styles.planActiveText,
                  {color: isUserPremium 
                    ? (isDarkMode ? colors.success : '#07BC4C') 
                    : (isDarkMode ? colors.warning : '#F57C00')}
                ]}>
                {isUserPremium ? 'ACTIVE' : 'LIMITED'}
              </Text>
            </View>
            
            {/* Premium Upgrade Button - New Addition */}
            {!isUserPremium && (
              <TouchableOpacity
                onPress={navigateToPremium}
                style={styles.upgradeButton}
              >
                <LinearGradient
                  colors={isDarkMode ? ['#8E2DE2', '#4A00E0'] : ['#11998e', '#38ef7d']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.upgradeButtonGradient}
                >
                  <Icon name="award" size={16} color="#FFF" style={styles.upgradeButtonIcon} />
                  <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            {/* View Plans Button - Always visible */}
            <TouchableOpacity
              onPress={navigateToPremium}
              style={[styles.viewPlansButton, {
                marginTop: isUserPremium ? 16 : 8
              }]}
            >
              <Text style={[styles.viewPlansButtonText, {
                color: isDarkMode ? colors.primary : '#11998e'
              }]}>
                {isUserPremium ? 'Manage Subscription' : 'View Available Plans'}
              </Text>
              <Icon 
                name="chevron-right" 
                size={16} 
                color={isDarkMode ? colors.primary : '#11998e'} 
                style={{marginLeft: 4}}
              />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Transactions Section */}
        <View style={styles.transactionsContainer}>
          <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
            Recent Transactions
          </Text>

          {/* Tabs */}
          <View style={[styles.tabsContainer, {borderBottomColor: colors.border}]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'earnings' && [
                  styles.activeTab,
                  {borderBottomColor: colors.primary}
                ]
              ]}
              onPress={() => setActiveTab('earnings')}>
              <Text 
                style={[
                  styles.tabText, {color: activeTab === 'earnings' ? colors.primary : colors.text.secondary},
                ]}>
                My Ads Earnings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'withdrawals' && [
                  styles.activeTab,
                  {borderBottomColor: colors.primary}
                ]
              ]}
              onPress={() => setActiveTab('withdrawals')}>
              <Text 
                style={[
                  styles.tabText, {color: activeTab === 'withdrawals' ? colors.primary : colors.text.secondary},
                ]}>
                Withdrawal Requests
              </Text>
            </TouchableOpacity>
          </View>

          {/* Transaction List */}
          {activeTab === 'earnings' ? (
            transactions.length === 0 ? (
              <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
                No earnings to display
              </Text>
            ) : (
              transactions
                .filter(tx => tx.type === 'credit')
                .map((transaction, index) => (
                  <View
                    key={`transaction-${index}`}
                    style={[
                      styles.transactionItem,
                      {borderBottomColor: colors.border},
                    ]}>
                    <View style={styles.transactionDetails}>
                      <Text
                        style={[
                          styles.transactionTitle,
                          {color: colors.text.primary},
                        ]}>
                        {transaction.description || 'Ad Earnings'}
                      </Text>
                      <Text
                        style={[
                          styles.transactionDate,
                          {color: colors.textSecondary},
                        ]}>
                        {new Date(transaction.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        {color: colors.success},
                      ]}>
                      +₹{transaction.amount}
                    </Text>
                  </View>
                ))
            )
          ) : (
            withdrawRequests.length === 0 ? (
              <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
                No withdrawal requests
              </Text>
            ) : (
              withdrawRequests.map((request, index) => (
                <View
                  key={`withdrawal-${index}`}
                  style={[
                    styles.transactionItem,
                    {borderBottomColor: colors.border},
                  ]}>
                  <View style={styles.transactionDetails}>
                    <Text
                      style={[
                        styles.transactionTitle,
                        {color: colors.text.primary},
                      ]}>
                      Withdrawal Request
                    </Text>
                    <Text
                      style={[
                        styles.transactionDate,
                        {color: colors.textSecondary},
                      ]}>
                      {new Date(request.created_at).toLocaleDateString()}
                    </Text>
                    <Text
                      style={[
                        styles.withdrawalStatus,
                        {
                          color:
                            request.status === 'completed'
                              ? colors.success
                              : request.status === 'rejected'
                              ? colors.error
                              : colors.warning,
                        },
                      ]}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {color: colors.error},
                    ]}>
                    -₹{request.amount}
                  </Text>
                </View>
              ))
            )
          )}

          {/* Withdrawal Info */}
          {activeTab === 'withdrawals' && (
            <Text style={[styles.withdrawInfo, {color: colors.text.secondary}]}>
              Minimum withdrawal ₹{WITHDRAWAL_THRESHOLD.PREMIUM} for premium. Non-premium user minimum withdrawal ₹{WITHDRAWAL_THRESHOLD.REGULAR}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Amount Input Modal */}
      <Modal
        transparent={true}
        visible={isAmountModalVisible}
        animationType="slide"
        onRequestClose={() => setIsAmountModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            onPress={() => setIsAmountModalVisible(false)} // Close on overlay press
          />
          <LinearGradient
            colors={isDarkMode ? [colors.surface, colors.background] : ['#E0EAFC', '#CFDEF3']}
            style={[styles.modalContent, {backgroundColor: colors.background}]}
          >
            <Text style={[styles.modalTitle, {color: colors.text.primary}]}>Add Money to Wallet</Text>
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
                style={[styles.modalButton, {backgroundColor: colors.primaryMuted}]}
                onPress={() => setIsAmountModalVisible(false)}>
                <Text style={[styles.modalButtonText, {color: colors.primary}]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: colors.primary}]}
                onPress={handleProceedWithAmount}>
                <Text style={[styles.modalButtonText, {color: colors.onPrimary}]}>Proceed</Text>
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
    padding: 16,
    paddingBottom: 70, // Ensure content doesn't hide behind bottom nav/tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceLabel: {
    fontSize: 18, // Adjusted
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10, // Added margin
  },
  balanceValue: {
    fontSize: 40, // Adjusted
    fontWeight: 'bold',
  },
  currencyLabel: {
    fontSize: 20, // Adjusted
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12, // Adjusted
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addMoneyButton: {
    // backgroundColor: '#FFFFFF', // Handled by dark mode logic
    marginRight: 8,
  },
  addMoneyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    // color: '#333', // Handled by dark mode logic
  },
  withdrawButton: {
    // backgroundColor: '#222222', // Handled by dark mode logic
    marginLeft: 8,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '600',
    // color: '#FFFFFF', // Handled by dark mode logic
  },
  disabledButton: {
    backgroundColor: '#CCCCCC', // Universal disabled color
    opacity: 0.7,
  },
  disabledButtonText: {
    color: '#888888', // Universal disabled text color
  },
  planContainer: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  planExpiry: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 14,
  },
  planStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planStatusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
  },
  planStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  planActiveText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  // New styles for upgrade button
  upgradeButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  upgradeButtonIcon: {
    marginRight: 8,
  },
  upgradeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  viewPlansButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginTop: 8,
  },
  viewPlansButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsContainer: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18, // Adjusted
    fontWeight: '600',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    // borderBottomColor: '#E0E0E0', // Handled by theme
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  // activeTabText: { // Combined with tabText color logic
  //   fontWeight: '600',
  // },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    padding: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  withdrawalStatus: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  withdrawInfo: {
    marginTop: 12,
    fontSize: 12,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
    elevation: 5, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  amountInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WalletScreen;