import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';
import LinearGradient from 'react-native-linear-gradient';
import { useUserPremiumStatus } from '../../contexts/UserDataContext';
import { getWithdrawalConfirmationMessage } from '../../utils/withdrawalMessaging';

const WithdrawalConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { colors, isDarkMode } = useTheme();
  const { isPremium } = useUserPremiumStatus();
  const [processing, setProcessing] = useState(false);

  const routeParams = route.params as any;
  const amount = routeParams?.amount || 0;
  const balance = routeParams?.balance || 0;
  const selectedMethod = routeParams?.selectedMethod || '';
  const upiId = routeParams?.upiId || '';
  const onSuccess = routeParams?.onSuccess;

  const getMethodDetails = () => {
    const methods: { [key: string]: { name: string; icon: string; color: string } } = {
      'upi-id': { name: 'UPI ID', icon: 'credit-card', color: colors.primary },
      'phonepe': { name: 'PhonePe', icon: 'smartphone', color: '#5F2ABD' },
      'googlepay': { name: 'Google Pay', icon: 'smartphone', color: '#4285F4' },
      'paytm': { name: 'Paytm', icon: 'smartphone', color: '#00BAF2' },
      'bhim': { name: 'BHIM UPI', icon: 'smartphone', color: '#F26822' },
      'amazonpay': { name: 'Amazon Pay', icon: 'smartphone', color: '#FF9900' },
    };
    return methods[selectedMethod] || { name: 'Unknown', icon: 'help-circle', color: colors.primary };
  };

  const handleConfirmWithdrawal = async () => {
    setProcessing(true);
    
    try {
      // Simulate API call for withdrawal request
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message with user-specific messaging
      const charges = amount * 0.05; // 5% charges
      const netAmount = amount - charges;
      const confirmationMessage = getWithdrawalConfirmationMessage(isPremium, amount, charges, netAmount);

      Alert.alert(
        'Withdrawal Requested',
        confirmationMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSuccess) {
                onSuccess();
              }
              navigation.navigate('Wallet');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Request Failed',
        'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessing(false);
    }
  };

  const methodDetails = getMethodDetails();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        backgroundColor={colors.background} 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
      />
      
      <Header
        title="Confirm Withdrawal"
        showSearch={false}
        showWallet={false}
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

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Header Card */}
        <View style={[styles.headerCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          <View style={[styles.successIcon, { backgroundColor: colors.primary + '20' }]}>
            <Icon name="check-circle" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Confirm Withdrawal
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
            Please review your transaction details
          </Text>
        </View>

        {/* Transaction Details */}
        <View style={[styles.detailsCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.detailsTitle, { color: colors.text.primary }]}>
            Transaction Details
          </Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                Amount
              </Text>
              <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                ₹{amount}
              </Text>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                Payment Method
              </Text>
              <View style={styles.methodContainer}>
                <View style={[styles.methodIcon, { backgroundColor: methodDetails.color + '20' }]}>
                  <Icon name={methodDetails.icon} size={16} color={methodDetails.color} />
                </View>
                <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                  {methodDetails.name}
                </Text>
              </View>
            </View>

            {upiId && (
              <>
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                    UPI ID
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                    {upiId}
                  </Text>
                </View>
              </>
            )}

            <View style={[styles.separator, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                Processing Time
              </Text>
              <Text style={[styles.detailValue, { color: colors.primary }]}>
                3-5 business days
              </Text>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                Remaining Balance
              </Text>
              <Text style={[styles.detailValue, { color: colors.text.primary }]}>
                ₹{(balance - amount).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Important Notice */}
        <View style={[styles.noticeCard, { backgroundColor: '#FFF3CD' }]}>
          <View style={styles.noticeHeader}>
            <Icon name="alert-triangle" size={20} color="#856404" />
            <Text style={[styles.noticeTitle, { color: '#856404' }]}>
              Important Notice
            </Text>
          </View>
          <Text style={[styles.noticeText, { color: '#856404' }]}>
            • Please ensure your UPI app is active and has sufficient balance limits
          </Text>
          <Text style={[styles.noticeText, { color: '#856404' }]}>
            • Transaction cannot be reversed once processed
          </Text>
          <Text style={[styles.noticeText, { color: '#856404' }]}>
            • Processing time may vary based on bank holidays
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            { opacity: processing ? 0.6 : 1 }
          ]}
          onPress={handleConfirmWithdrawal}
          disabled={processing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#28A745', '#20C997']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {processing ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.confirmButtonText}>Confirm Withdrawal</Text>
                <Icon name="check-circle" size={20} color="#fff" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.backToMethodsButton, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
          disabled={processing}
        >
          <Text style={[styles.backToMethodsText, { color: colors.text.primary }]}>
            Back to Payment Methods
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  headerCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  detailsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 16,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
  noticeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 34,
    gap: 12,
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backToMethodsButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backToMethodsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
});

export default WithdrawalConfirmationScreen;
