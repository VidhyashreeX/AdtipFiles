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
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';
import LinearGradient from 'react-native-linear-gradient';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  isPopular?: boolean;
}

const WithdrawalMethodScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { colors, isDarkMode } = useTheme();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [upiId, setUpiId] = useState('');

  const routeParams = route.params as any;
  const amount = routeParams?.amount || 0;
  const balance = routeParams?.balance || 0;
  const minimumWithdrawal = routeParams?.minimumWithdrawal || 100;

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'upi-id',
      name: 'UPI ID',
      icon: 'credit-card',
      description: 'Enter any UPI ID manually',
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      icon: 'smartphone',
      description: 'Quick transfer via PhonePe',
      isPopular: true,
    },
    {
      id: 'googlepay',
      name: 'Google Pay',
      icon: 'smartphone',
      description: 'Transfer using Google Pay',
      isPopular: true,
    },
    // {
    //   id: 'paytm',
    //   name: 'Paytm',
    //   icon: 'smartphone',
    //   description: 'Send money via Paytm UPI',
    // },
    // {
    //   id: 'bhim',
    //   name: 'BHIM UPI',
    //   icon: 'smartphone',
    //   description: 'Transfer through BHIM UPI',
    // },
    // {
    //   id: 'amazonpay',
    //   name: 'Amazon Pay',
    //   icon: 'smartphone',
    //   description: 'Quick pay via Amazon Pay',
    // },
  ];

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleUpiIdSubmit = () => {
    if (!upiId || !upiId.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID');
      return;
    }
    navigateToConfirmation();
  };

  const navigateToConfirmation = () => {
    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please select a payment method');
      return;
    }

    navigation.navigate('WithdrawalConfirmationScreen', {
      amount,
      balance,
      minimumWithdrawal,
      selectedMethod,
      upiId: selectedMethod === 'upi-id' ? upiId : null,
      onSuccess: routeParams?.onSuccess,
    });
  };

  const getMethodIcon = (method: PaymentMethod) => {
    if (method.id === 'upi-id') {
      return (
        <Image
          source={require('../../assets/upi_icon/upi.png')}
          style={{ width: 24, height: 24 }}
          resizeMode="contain"
        />
      );
    }
    if (method.id === 'phonepe') {
      return (
        <Image
          source={require('../../assets/phonepeicon/icons8-phone-pe-48.png')}
          style={{ width: 24, height: 24 }}
          resizeMode="contain"
        />
      );
    }
    if (method.id === 'googlepay') {
      return (
        <Image
          source={require('../../assets/gpayicon/icons8-google-pay-48.png')}
          style={{ width: 24, height: 24 }}
          resizeMode="contain"
        />
      );
    }
    return <Icon name={method.icon} size={24} color={getMethodColor(method)} />;
  };

  const getMethodColor = (method: PaymentMethod) => {
    if (method.id === 'phonepe') return '#5F2ABD';
    if (method.id === 'googlepay') return '#4285F4';
    // if (method.id === 'paytm') return '#00BAF2';
    // if (method.id === 'bhim') return '#F26822';
    // if (method.id === 'amazonpay') return '#FF9900';
    return colors.primary;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        backgroundColor={colors.background} 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
      />
      
      <Header
        title="Select Payment Method"
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
        {/* Header Info */}
        <View style={[styles.headerCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Choose Payment Method
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
            Select how you want to receive ₹{amount}
          </Text>
        </View>

        {/* Payment Methods */}
        <View style={[styles.methodsCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodItem,
                {
                  backgroundColor: selectedMethod === method.id 
                    ? colors.primary + '10' 
                    : 'transparent',
                  borderColor: selectedMethod === method.id 
                    ? colors.primary 
                    : colors.border,
                }
              ]}
              onPress={() => handleMethodSelect(method.id)}
            >
              {method.isPopular && (
                <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              )}
              
              <View style={styles.methodContent}>
                <View style={[
                  styles.methodIcon,
                  { backgroundColor: getMethodColor(method) + '20' }
                ]}>
                  {getMethodIcon(method)}
                </View>
                
                <View style={styles.methodInfo}>
                  <Text style={[styles.methodName, { color: colors.text.primary }]}>
                    {method.name}
                  </Text>
                  <Text style={[styles.methodDescription, { color: colors.text.secondary }]}>
                    {method.description}
                  </Text>
                </View>
                
                <View style={styles.methodActions}>
                  {selectedMethod === method.id && (
                    <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
                      <Icon name="check" size={16} color="#fff" />
                    </View>
                  )}
                  <Icon 
                    name="arrow-right" 
                    size={20} 
                    color={colors.text.tertiary} 
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* UPI ID Input */}
        {selectedMethod === 'upi-id' && (
          <View style={[styles.upiCard, { backgroundColor: colors.primary + '10' }]}>
            <View style={styles.upiHeader}>
              <Icon name="info" size={20} color={colors.primary} />
              <Text style={[styles.upiTitle, { color: colors.primary }]}>
                Enter UPI ID
              </Text>
            </View>
            <TextInput
              style={[
                styles.upiInput,
                {
                  backgroundColor: isDarkMode ? colors.surface : '#FFFFFF',
                  color: colors.text.primary,
                  borderColor: colors.border,
                }
              ]}
              placeholder="username@paytm"
              placeholderTextColor={colors.text.tertiary}
              value={upiId}
              onChangeText={setUpiId}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={[styles.upiHint, { color: colors.text.secondary }]}>
              Make sure your UPI ID is correct. Example: yourname@paytm
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { 
              opacity: !selectedMethod || 
                (selectedMethod === 'upi-id' && (!upiId || !upiId.includes('@'))) 
                ? 0.6 : 1 
            }
          ]}
          onPress={selectedMethod === 'upi-id' ? handleUpiIdSubmit : navigateToConfirmation}
          disabled={!selectedMethod || 
            (selectedMethod === 'upi-id' && (!upiId || !upiId.includes('@')))}
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
  headerCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  methodsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  methodItem: {
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: -6,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  popularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  upiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  upiTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  upiInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 8,
  },
  upiHint: {
    fontSize: 12,
    lineHeight: 16,
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

export default WithdrawalMethodScreen;
