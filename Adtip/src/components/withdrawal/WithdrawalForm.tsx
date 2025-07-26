import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import ApiService from '../../services/ApiService';
import EarningsTimeline from '../earnings/EarningsTimeline';
import { useUserPremiumStatus } from '../../contexts/UserDataContext';
import { useWallet } from '../../contexts/WalletContext';

interface WithdrawalFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newBalance?: number) => void;
  withdrawalType: 'wallet' | 'referral' | 'coupon' | 'content_earnings';
  availableBalance: number;
  userId: number;
  channelId?: number;
}

interface WithdrawalSettings {
  min_withdrawal_regular: string;
  min_withdrawal_premium: string;
  withdrawal_charges_percent: string;
  withdrawal_processing_days: string;
}

const WithdrawalForm: React.FC<WithdrawalFormProps> = ({
  visible,
  onClose,
  onSuccess,
  withdrawalType,
  availableBalance,
  userId,
  channelId,
}) => {
  const { colors } = useTheme();
  const { isPremium } = useUserPremiumStatus();
  const { refreshBalance } = useWallet();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<WithdrawalSettings | null>(null);
  const [amount, setAmount] = useState('');
  const [transactionMethod, setTransactionMethod] = useState<'BANK' | 'UPI'>('BANK');
  
  // Bank details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  
  // UPI details
  const [mobileNumber, setMobileNumber] = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    if (visible) {
      loadWithdrawalSettings();
    }
  }, [visible]);

  const loadWithdrawalSettings = async () => {
    try {
      const response = await ApiService.getWithdrawalSettings();
      if (response.status === 200) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading withdrawal settings:', error);
    }
  };

  // New withdrawal logic based on premium status
  const getMinimumAmount = () => {
    if (isPremium) return 1000; // Premium users: ₹1000 minimum
    return 5000; // Non-premium users: ₹5000 minimum
  };

  const getPlatformFeeRate = () => {
    if (isPremium) return 0.3; // 30% for premium users
    return 0.6; // 60% for non-premium users
  };

  const calculatePlatformFee = (amount: number) => {
    return amount * getPlatformFeeRate();
  };

  const calculateGST = (platformFee: number) => {
    return platformFee * 0.18; // 18% GST on platform fee
  };

  const calculateNetAmount = (amount: number) => {
    const platformFee = calculatePlatformFee(amount);
    const gst = calculateGST(platformFee);
    return amount - platformFee - gst;
  };

  const validateForm = () => {
    const amountNum = parseFloat(amount);
    const minAmount = getMinimumAmount();

    if (!amount || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    if (amountNum < minAmount) {
      Alert.alert('Error', `Minimum withdrawal amount is ₹${minAmount} for ${isPremium ? 'premium' : 'non-premium'} users`);
      return false;
    }

    if (amountNum > availableBalance) {
      Alert.alert('Error', `Insufficient balance. Available: ₹${availableBalance.toFixed(2)}`);
      return false;
    }

    if (transactionMethod === 'BANK') {
      if (!bankName || !accountNumber || !ifscCode) {
        Alert.alert('Error', 'Please fill all bank details');
        return false;
      }
    } else {
      if (!mobileNumber || !upiId) {
        Alert.alert('Error', 'Please fill all UPI details');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const amountNum = parseFloat(amount);
      const platformFee = calculatePlatformFee(amountNum);
      const gst = calculateGST(platformFee);
      const netAmount = calculateNetAmount(amountNum);

      let response;
      
      if (withdrawalType === 'wallet') {
        response = await ApiService.processWalletWithdrawal({
          userId,
          amount: amountNum,
          transactionMethod,
          bankName: transactionMethod === 'BANK' ? bankName : undefined,
          accountNumber: transactionMethod === 'BANK' ? accountNumber : undefined,
          ifscCode: transactionMethod === 'BANK' ? ifscCode : undefined,
          mobileNumber: transactionMethod === 'UPI' ? mobileNumber : undefined,
          upiId: transactionMethod === 'UPI' ? upiId : undefined,
        });
      } else if (withdrawalType === 'referral' || withdrawalType === 'coupon') {
        response = await ApiService.processReferralWithdrawal({
          userId,
          amount: amountNum,
          withdrawalType: withdrawalType as 'referral' | 'coupon',
          bankName: transactionMethod === 'BANK' ? bankName : undefined,
          bankIfsc: transactionMethod === 'BANK' ? ifscCode : undefined,
          bankAccountNumber: transactionMethod === 'BANK' ? accountNumber : undefined,
          upiId: transactionMethod === 'UPI' ? upiId : undefined,
        });
      } else if (withdrawalType === 'content_earnings') {
        response = await ApiService.processChannelWithdrawal({
          userId,
          channelId,
          amount: amountNum,
          withdrawalType: 'content_earnings',
          bankName: transactionMethod === 'BANK' ? bankName : undefined,
          bankIfsc: transactionMethod === 'BANK' ? ifscCode : undefined,
          bankAccountNumber: transactionMethod === 'BANK' ? accountNumber : undefined,
          upiId: transactionMethod === 'UPI' ? upiId : undefined,
        });
      }

      if (response.status === 200) {
        // Calculate new balance immediately
        const newBalance = availableBalance - amountNum;
        
        // Immediately refresh wallet balance in context
        await refreshBalance();
        
        Alert.alert(
          'Success',
          `Withdrawal request submitted successfully!\n\nAmount: ₹${amountNum}\nPlatform Fee: ₹${platformFee.toFixed(2)}\nGST: ₹${gst.toFixed(2)}\nNet Amount: ₹${netAmount.toFixed(2)}\n\nNew Balance: ₹${newBalance.toFixed(2)}`,
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess(newBalance);
                onClose();
                resetForm();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit withdrawal request');
      }
    } catch (error: any) {
      console.error('Error submitting withdrawal:', error);
      Alert.alert('Error', error.message || 'Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setTransactionMethod('BANK');
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    setMobileNumber('');
    setUpiId('');
  };

  const getWithdrawalTypeLabel = () => {
    switch (withdrawalType) {
      case 'wallet':
        return 'Wallet Withdrawal';
      case 'referral':
        return 'Referral Earnings Withdrawal';
      case 'coupon':
        return 'Coupon Earnings Withdrawal';
      case 'content_earnings':
        return 'Content Creator Earnings Withdrawal';
      default:
        return 'Withdrawal';
    }
  };

  const renderBankDetails = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Bank Details</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text.primary, borderColor: colors.border }]}
        placeholder="Bank Name"
        placeholderTextColor={colors.text.secondary}
        value={bankName}
        onChangeText={setBankName}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text.primary, borderColor: colors.border }]}
        placeholder="Account Number"
        placeholderTextColor={colors.text.secondary}
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="numeric"
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text.primary, borderColor: colors.border }]}
        placeholder="IFSC Code"
        placeholderTextColor={colors.text.secondary}
        value={ifscCode}
        onChangeText={setIfscCode}
        autoCapitalize="characters"
      />
    </View>
  );

  const renderUPIDetails = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>UPI Details</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text.primary, borderColor: colors.border }]}
        placeholder="Mobile Number"
        placeholderTextColor={colors.text.secondary}
        value={mobileNumber}
        onChangeText={setMobileNumber}
        keyboardType="phone-pad"
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text.primary, borderColor: colors.border }]}
        placeholder="UPI ID (e.g., user@upi)"
        placeholderTextColor={colors.text.secondary}
        value={upiId}
        onChangeText={setUpiId}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="x" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {getWithdrawalTypeLabel()}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Balance Info */}
          <View style={[styles.balanceCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.balanceLabel, { color: colors.text.secondary }]}>Available Balance</Text>
            <Text style={[styles.balanceAmount, { color: colors.text.primary }]}>₹{availableBalance.toFixed(2)}</Text>
          </View>

          {/* Processing Timeline */}
          <EarningsTimeline
            isPremium={isPremium}
            showFullTimeline={false}
            compact={true}
          />

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Withdrawal Amount</Text>
            <TextInput
              style={[styles.amountInput, { backgroundColor: colors.surface, color: colors.text.primary, borderColor: colors.border }]}
              placeholder="Enter amount"
              placeholderTextColor={colors.text.secondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            {amount && (
              <View style={styles.amountBreakdown}>
                <Text style={[styles.breakdownText, { color: colors.text.secondary }]}>
                  Amount: ₹{parseFloat(amount) || 0}
                </Text>
                <Text style={[styles.breakdownText, { color: colors.text.secondary }]}>
                  Platform Fee ({getPlatformFeeRate() * 100}%): ₹{calculatePlatformFee(parseFloat(amount) || 0).toFixed(2)}
                </Text>
                <Text style={[styles.breakdownText, { color: colors.text.secondary }]}>
                  GST (18%): ₹{calculateGST(calculatePlatformFee(parseFloat(amount) || 0)).toFixed(2)}
                </Text>
                <Text style={[styles.breakdownText, { color: colors.primary, fontWeight: 'bold' }]}>
                  Net Amount: ₹{calculateNetAmount(parseFloat(amount) || 0).toFixed(2)}
                </Text>
              </View>
            )}
            <Text style={[styles.minAmountText, { color: colors.text.tertiary }]}>
              Minimum withdrawal: ₹{getMinimumAmount()} ({isPremium ? 'premium' : 'non-premium'} users)
            </Text>
          </View>

          {/* Payment Method Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Payment Method</Text>
            <View style={styles.methodButtons}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  { backgroundColor: colors.surface },
                  transactionMethod === 'BANK' && { backgroundColor: colors.primary }
                ]}
                onPress={() => setTransactionMethod('BANK')}
              >
                <Icon name="credit-card" size={20} color={transactionMethod === 'BANK' ? colors.white : colors.text.primary} />
                <Text style={[styles.methodButtonText, { color: transactionMethod === 'BANK' ? colors.white : colors.text.primary }]}>
                  Bank Transfer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  { backgroundColor: colors.surface },
                  transactionMethod === 'UPI' && { backgroundColor: colors.primary }
                ]}
                onPress={() => setTransactionMethod('UPI')}
              >
                <Icon name="smartphone" size={20} color={transactionMethod === 'UPI' ? colors.white : colors.text.primary} />
                <Text style={[styles.methodButtonText, { color: transactionMethod === 'UPI' ? colors.white : colors.text.primary }]}>
                  UPI
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Payment Details */}
          {transactionMethod === 'BANK' ? renderBankDetails() : renderUPIDetails()}

          {/* Processing Info */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Icon name="info" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              Processing takes {settings?.withdrawal_processing_days || '3-5'} business days
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.submitButtonText, { color: colors.white }]}>
                Submit Withdrawal Request
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  amountInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  amountBreakdown: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  breakdownText: {
    fontSize: 14,
    marginBottom: 4,
  },
  minAmountText: {
    fontSize: 12,
    marginTop: 8,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WithdrawalForm; 