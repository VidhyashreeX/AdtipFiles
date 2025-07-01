import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import RazorpayCheckout from 'react-native-razorpay';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../../components/common/Header';

const { width } = Dimensions.get('window');

const ContentCreatorSubscriptionScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await ApiService.get('/content-creator-plans');
        if (response.status) {
          setPlans(response.data);
          if (response.data.length > 1) {
            setSelectedPlanId(response.data[1].id);
          } else if (response.data.length > 0) {
            setSelectedPlanId(response.data[0].id);
          }
        } else {
          Alert.alert('Error', 'Could not fetch content creator plans.');
        }
      } catch (error) {
        Alert.alert('Error', 'An error occurred while fetching plans.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handlePayment = async () => {
    if (!selectedPlanId) {
      Alert.alert('No Plan Selected', 'Please select a plan.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Authentication Error', 'Could not identify user. Please log in again.');
      return;
    }
    setPaymentProcessing(true);
    try {
      const keyRes = await ApiService.getRazorpayDetails();
      const razorpayKey = keyRes.api_key;
      const res = await ApiService.post('/content-creator/subscribe', { plan_id: selectedPlanId });
      if (!res.status || !res.order) {
        throw new Error(res.message || 'Failed to create order.');
      }
      const order = res.order;
      const options = {
        key: razorpayKey,
        order_id: order.id,
        name: 'Content Creator Premium',
        description: 'Your content creator premium plan',
        amount: order.amount,
        currency: order.currency,
        prefill: {
          email: user.emailId,
          contact: '',
          name: user.name,
        },
        theme: { color: colors.primary },
      };
      RazorpayCheckout.open(options)
        .then(async (paymentData: any) => {
          await ApiService.post('/content-creator/payment-callback', paymentData);
          Alert.alert('Success', 'Your content creator plan is being processed!');
          navigation.goBack();
        })
        .catch((error: any) => {
          Alert.alert('Payment Failed', `Code: ${error.code}\nDescription: ${error.description}`);
        })
        .finally(() => {
          setPaymentProcessing(false);
        });
    } catch (error: any) {
      setPaymentProcessing(false);
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    }
  };

  const freeFeatures = [
    'No earnings for uploads on TipTube & TipShort.',
    'Free Video upload only.',
    'Earn 0.06 paisa per ad view',
    'Fan Call to earn 0.60 paisa (coming soon)',
    'Fan Video to earn 1 rs/- (coming soon)',
  ];
  const premiumFeatures = [
    'Earnings for uploads on TipTube & TipShort',
    'Free & Paid video upload',
    'To earn upto 10000/- rs per ad view',
    'Fan call to earn 4 rs/- (coming soon)',
    'Fan Video to earn 8 rs/- (coming soon)',
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Header title="Content Creator Plans" showSearch={false} showWallet={false} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text.primary, marginBottom: 12 }}>
          Free vs Premium Benefits
        </Text>
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          {/* Free Card */}
          <View style={{ flex: 1, backgroundColor: '#222', borderRadius: 16, padding: 16, marginRight: 8, borderWidth: 2, borderColor: '#00C853' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#fff', marginBottom: 8 }}>FREE</Text>
            {freeFeatures.map((f, i) => (
              <Text key={i} style={{ color: '#fff', marginBottom: 4 }}>{f}</Text>
            ))}
          </View>
          {/* Premium Card */}
          <View style={{ flex: 1, backgroundColor: '#111', borderRadius: 16, padding: 16, marginLeft: 8, borderWidth: 2, borderColor: '#00C853' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#00C853', marginBottom: 8 }}>PREMIUM</Text>
            {premiumFeatures.map((f, i) => (
              <Text key={i} style={{ color: f.includes('10000') ? '#ffd600' : '#fff', fontWeight: f.includes('10000') ? 'bold' : 'normal', marginBottom: 4 }}>{f}</Text>
            ))}
          </View>
        </View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text.primary, marginBottom: 12 }}>Choose Your Plan</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          plans.map((plan: any, idx: number) => (
            <TouchableOpacity
              key={plan.id}
              style={{
                backgroundColor: selectedPlanId === plan.id ? '#00C853' : '#333',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                borderWidth: selectedPlanId === plan.id ? 2 : 0,
                borderColor: '#fff',
              }}
              onPress={() => setSelectedPlanId(plan.id)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{plan.name}</Text>
              <Text style={{ color: '#fff', marginTop: 4 }}>₹{plan.price} / {plan.billing_cycle}</Text>
              <Text style={{ color: '#fff', marginTop: 4 }}>{plan.description}</Text>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity
          style={{ backgroundColor: '#00C853', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 }}
          onPress={handlePayment}
          disabled={paymentProcessing}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Continue to Payment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ContentCreatorSubscriptionScreen; 