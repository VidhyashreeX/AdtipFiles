import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';
import LinearGradient from 'react-native-linear-gradient';

const WithdrawalAmountScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { colors, isDarkMode } = useTheme();
  const [amount, setAmount] = useState('');

  const routeParams = route.params as any;
  const balance = routeParams?.balance || 0;
  const minimumWithdrawal = routeParams?.minimumWithdrawal || 100;

  const handleAmountSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (parseFloat(amount) < minimumWithdrawal) {
      Alert.alert(
        'Amount Too Low',
        `Minimum withdrawal amount is ₹${minimumWithdrawal}`
      );
      return;
    }
    if (parseFloat(amount) > balance) {
      Alert.alert(
        'Insufficient Balance',
        `You only have ₹${balance.toFixed(2)} available`
      );
      return;
    }
    if (parseFloat(amount) > 50000) {
      Alert.alert(
        'Amount Too High',
        'Maximum withdrawal amount is ₹50,000 per transaction'
      );
      return;
    }

    navigation.navigate('WithdrawalMethodScreen', {
      amount: parseFloat(amount),
      balance,
      minimumWithdrawal,
      onSuccess: routeParams?.onSuccess,
    });
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000].filter(
    amt => amt <= balance && amt >= minimumWithdrawal
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        backgroundColor={colors.background} 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
      />
      
      <Header
        title="Withdraw Money"
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
        {/* Amount Input Card */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Icon name="dollar-sign" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
              Withdraw Money
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.text.secondary }]}>
              Enter the amount you want to withdraw
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
              Amount
            </Text>
            <View style={[
              styles.inputContainer,
              { 
                borderColor: colors.border,
                backgroundColor: isDarkMode ? colors.surface : '#F8F9FA',
              }
            ]}>
              <Text style={[styles.currencySymbol, { color: colors.text.tertiary }]}>
                ₹
              </Text>
              <TextInput
                style={[
                  styles.amountInput,
                  { 
                    color: colors.text.primary,
                  }
                ]}
                placeholder="0"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                maxLength={8}
                autoFocus
              />
            </View>
          </View>

          {/* Quick Amount Buttons */}
          {quickAmounts.length > 0 && (
            <View style={styles.quickAmountsSection}>
              <Text style={[styles.quickAmountsLabel, { color: colors.text.secondary }]}>
                Quick amounts
              </Text>
              <View style={styles.quickAmountsContainer}>
                {quickAmounts.map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[
                      styles.quickAmountButton,
                      { 
                        backgroundColor: isDarkMode ? colors.surface : colors.background,
                        borderColor: colors.border,
                      }
                    ]}
                    onPress={() => setAmount(quickAmount.toString())}
                  >
                    <Text style={[styles.quickAmountText, { color: colors.text.primary }]}>
                      ₹{quickAmount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Info Section */}
          <View style={[styles.infoSection, { backgroundColor: colors.primary + '10' }]}>
            <View style={styles.infoItem}>
              <Icon name="shield" size={16} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.primary }]}>
                Transaction Limits
              </Text>
            </View>
            <View style={styles.infoDetails}>
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                • Minimum: ₹{minimumWithdrawal}
              </Text>
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                • Maximum: ₹50,000 per transaction
              </Text>
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                • Available balance: ₹{balance.toFixed(2)}
              </Text>
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                • Processing time: 3-5 business days
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { opacity: !amount || parseFloat(amount) <= 0 ? 0.6 : 1 }
          ]}
          onPress={handleAmountSubmit}
          disabled={!amount || parseFloat(amount) <= 0}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Icon name="arrow-right" size={20} color="#fff" />
          </LinearGradient>
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
  card: {
    borderRadius: 16,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  quickAmountsSection: {
    marginBottom: 24,
  },
  quickAmountsLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoDetails: {
    gap: 4,
  },
  infoText: {
    fontSize: 14,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 34,
  },
  continueButton: {
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
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    padding: 8,
  },
});

export default WithdrawalAmountScreen;
