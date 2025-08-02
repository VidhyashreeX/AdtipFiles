import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions, ScrollView, SafeAreaView, StatusBar, Platform } from 'react-native';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { Zap } from 'lucide-react-native';
import Header from '../../components/common/Header';

const AMOUNTS = [200, 500, 1000, 5000, 10000, 50000, 100000];
const API_BASE_URL = 'https://api.adtip.in/api';
const CELEBRATION_ANIMATION = require('../../../assets/lottie/money_rain.json');
const { width, height } = Dimensions.get('window');

const AddFundsScreen = () => {
  const [loading, setLoading] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const handleAddFunds = async (amount: number) => {
    if (!amount) {
      Alert.alert('Error', 'Please select an amount to add funds.');
      return;
    }
    setLoading(true);
    try {
      let token = await AsyncStorage.getItem('accessToken');
      if (!token) token = await AsyncStorage.getItem('@auth_token');
      const userId = user?.id;
      if (!token || !userId) {
        Alert.alert('Error', 'User not authenticated. Please login again.');
        setLoading(false);
        return;
      }
      // 1. Get Razorpay key
      const keyRes = await fetch(`${API_BASE_URL}/razorpay-details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const keyData = await keyRes.json();
      if (!keyData.api_key) throw new Error('Failed to fetch Razorpay key');
      const razorpayKey = keyData.api_key;

      // 2. Create Razorpay order
      await fetch(`${API_BASE_URL}/razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, currency: 'INR', user_id: Number(userId) }),
      });
      // 3. Open Razorpay checkout
      const orderRes = await fetch(`${API_BASE_URL}/razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, currency: 'INR', user_id: Number(userId) }),
      });
      const orderData = await orderRes.json();
      if (!orderData.status || !orderData.data?.id) throw new Error('Order creation failed');
      const orderId = orderData.data.id;
      const orderAmount = orderData.data.amount;

      RazorpayCheckout.open({
        key: razorpayKey,
        amount: orderAmount,
        currency: 'INR',
        name: 'Adtip',
        description: 'Add Funds',
        order_id: orderId,
        prefill: {},
        theme: { color: colors.primary },
      })
        .then(async (response: any) => {
          // 4. Verify payment
          const verifyRes = await fetch(`${API_BASE_URL}/razorpay-verification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              transaction_for: 'addfunds',
              order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount,
              currency: 'INR',
              user_id: Number(userId),
              payment_status: 'success',
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.status) throw new Error('Payment verification failed');

          // 5. Add funds
          const addFundsRes = await fetch(`${API_BASE_URL}/addfunds`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              createdby: Number(userId),
              amount,
              transactionStatus: '1',
              transaction_type: 'Deposite',
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              isCron: false,
            }),
          });
          const addFundsData = await addFundsRes.json();
          if (addFundsData.status !== 200) throw new Error('Funds addition failed');

          // 6. Show celebration
          setCelebrate(true);
          setTimeout(() => {
            setCelebrate(false);
            navigation.goBack();
          }, 2500);
        })
        .catch((err: any) => {
          Alert.alert('Payment Failed', 'Your payment was not completed.');
        })
        .finally(() => setLoading(false));
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Something went wrong');
    }
  };

  const benefits = [
    {
      icon: 'phone',
      title: 'Tip Calls',
      description: 'Make calls to creators and content providers',
      color: '#4CAF50'
    },
    {
      icon: 'visibility',
      title: 'Watch Ads',
      description: 'Earn money by watching advertisements',
      color: '#2196F3'
    },
    {
      icon: 'star',
      title: 'Premium Features',
      description: 'Access exclusive premium content and features',
      color: '#FF9800'
    },
    {
      icon: 'zap',
      title: 'Quick Transactions',
      description: 'Fast and secure payment processing',
      color: '#9C27B0'
    }
  ];

  const renderBenefitCard = (benefit: any, index: number) => (
    <View 
      key={index} 
      style={[
        styles.benefitCard, 
        { 
          backgroundColor: isDarkMode ? colors.card : colors.surface,
          borderColor: isDarkMode ? colors.border : 'transparent'
        }
      ]}
    >
      <View style={[styles.benefitIcon, { backgroundColor: benefit.color + '20' }]}>
        {benefit.icon === 'zap' ? (
          <Zap size={24} color={benefit.color} />
        ) : (
          <Icon name={benefit.icon} size={24} color={benefit.color} />
        )}
      </View>
      <Text style={[styles.benefitTitle, { color: (colors.text?.primary || colors.text) as string }]}>
        {benefit.title}
      </Text>
      <Text style={[styles.benefitDescription, { color: (colors.text?.secondary || colors.text) as string }]}>
        {benefit.description}
      </Text>
    </View>
  );

  const renderAmountCard = (amount: number, index: number) => {
    const isSelected = selectedAmount === amount;
    const isPopular = amount === 500; // Make 500 popular
    
    return (
      <TouchableOpacity
        key={amount}
        style={[
          styles.amountCard,
          {
            backgroundColor: isSelected 
              ? colors.primary + '15' 
              : (isDarkMode ? colors.card : colors.surface),
            borderColor: isSelected ? colors.primary : (isDarkMode ? colors.border : '#E8E8E8'),
            borderWidth: isSelected ? 2 : 1,
            transform: isSelected ? [{ scale: 1.02 }] : [{ scale: 1 }],
          }
        ]}
        onPress={() => setSelectedAmount(amount)}
        activeOpacity={0.7}
      >
        {isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.popularText}>Popular</Text>
          </View>
        )}
        <Text style={[styles.amountText, { color: isSelected ? colors.primary : (colors.text?.primary || colors.text) as string }]}>
          ₹{amount}
        </Text>
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
            <Icon name="check" size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (celebrate) {
    return (
      <View style={[styles.celebrateContainer, { backgroundColor: isDarkMode ? colors.background : '#fff' }] }>
        <LottieView source={CELEBRATION_ANIMATION} autoPlay loop={false} style={{ width, height: '100%' }} />
        <View style={styles.celebrateTextWrap}>
          <Text style={[styles.celebrateText, { color: colors.primary }]}>Payment Successful!</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        backgroundColor={colors.background} 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
      />
      
      <Header
        title="Add Funds"
        showSearch={false}
        showWallet={false}
        showPremium={false}
        leftComponent={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <FeatherIcon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Selection Section */}
        <View style={styles.amountSection}>
          <Text style={[styles.sectionTitle, { color: (colors.text?.primary || colors.text) as string }]}>
            Select Amount
          </Text>
          <Text style={[styles.sectionSubtitle, { color: (colors.text?.secondary || colors.text) as string }]}>
            Choose how much you want to add to your wallet
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.amountScrollContainer}
            style={styles.amountScroll}
          >
            {AMOUNTS.map(renderAmountCard)}
          </ScrollView>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={[styles.sectionTitle, { color: (colors.text?.primary || colors.text) as string }]}>
            Why Add Funds?
          </Text>
          <View style={styles.benefitsGrid}>
            {benefits.map(renderBenefitCard)}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: isDarkMode ? colors.border : '#E0E0E0' }]}>
        <View style={styles.selectedAmountInfo}>
          <Text style={[styles.selectedAmountLabel, { color: (colors.text?.secondary || colors.text) as string }]}>
            Selected Amount
          </Text>
          <Text style={[styles.selectedAmountValue, { color: colors.primary }]}>
            ₹{selectedAmount || 0}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.addFundsButton, 
            { 
              opacity: (!selectedAmount || loading) ? 0.6 : 1 
            }
          ]}
          onPress={() => selectedAmount && handleAddFunds(selectedAmount)}
          disabled={!selectedAmount || loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <View style={styles.loadingButtonContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.loadingButtonText}>Processing...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Icon name="payment" size={20} color="#fff" />
                <Text style={styles.addFundsButtonText}>Add Funds</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Icon name="security" size={14} color={(colors.text?.tertiary || colors.text) as string} />
          <Text style={[styles.securityText, { color: (colors.text?.tertiary || colors.text) as string }]}>
            Secured by Razorpay • 256-bit SSL encryption
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  benefitsSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benefitCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  benefitDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
  },
  amountSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  amountScroll: {
    marginTop: 16,
  },
  amountScrollContainer: {
    paddingHorizontal: 10,
    gap: 16,
  },
  amountCard: {
    width: 120,
    height: 80,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    elevation: 3,
  },
  popularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedAmountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedAmountLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedAmountValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addFundsButton: {
    height: 56,
    borderRadius: 16,
    marginBottom: 12,
  },
  buttonGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addFundsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  celebrateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrateTextWrap: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    alignItems: 'center',
  },
  celebrateText: {
    fontSize: 28,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default AddFundsScreen; 