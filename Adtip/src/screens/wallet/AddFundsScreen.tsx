import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from 'react-native';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

const AMOUNTS = [200, 500, 1000, 5000, 10000, 50000, 100000];
const API_BASE_URL = 'https://api.adtip.in/api';
const CELEBRATION_ANIMATION = require('../../../assets/lottie/money_rain.json');
const { width } = Dimensions.get('window');

const AddFundsScreen = () => {
  const [loading, setLoading] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const handleAddFunds = async (amount: number) => {
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
    <View style={[styles.container, { backgroundColor: isDarkMode ? colors.background : '#fff' }] }>
      <Text style={[styles.title, { color: isDarkMode ? colors.primary : colors.secondary }]}>Select Amount to Add</Text>
      <View style={styles.amountsWrap}>
        {AMOUNTS.map((amt) => (
          <TouchableOpacity
            key={amt}
            style={{ width: width * 0.8, marginVertical: 12, borderRadius: 18, overflow: 'hidden', elevation: isDarkMode ? 0 : 3, shadowColor: isDarkMode ? 'transparent' : '#000' }}
            onPress={() => handleAddFunds(amt)}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isDarkMode ? ['#232526', '#414345'] : ['#C1FFA1', '#A1FFA1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 18 }}
            >
              <Text style={{ fontSize: 22, fontWeight: '700', color: isDarkMode ? colors.text.primary : colors.primary, letterSpacing: 1 }}>
                ₹{amt}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
      {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 36,
    letterSpacing: 0.5,
  },
  amountsWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
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
});

export default AddFundsScreen; 