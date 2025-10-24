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
        // Use correct API method
        const response = await ApiService.getContentSubscriptionPlans();
        console.log('[ContentCreatorSubscription] Plans response:', response);
        
        if (response.status && response.plans) {
          setPlans(response.plans);
          if (response.plans.length > 1) {
            // Select the middle plan (usually the best value)
            setSelectedPlanId(response.plans[1].id);
          } else if (response.plans.length > 0) {
            setSelectedPlanId(response.plans[0].id);
          }
        } else {
          Alert.alert('Error', 'Could not fetch content creator plans.');
        }
      } catch (error) {
        console.error('[ContentCreatorSubscription] Error fetching plans:', error);
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
      // Get Razorpay key
      const keyRes = await ApiService.getContentPremiumRazorpayDetails();
      const razorpayKey = keyRes.api_key;
      
      // Create subscription using correct API
      const res = await ApiService.createContentPremiumSubscription(selectedPlanId, user.id);
      
      console.log('[ContentCreatorSubscription] Subscription creation response:', res);
      
      if (!res.status || !res.subscription_id) {
        throw new Error(res.message || 'Failed to create subscription.');
      }
      
      // Find the selected plan for display
      const selectedPlan = plans.find(p => p.id === selectedPlanId);
      
      const options = {
        key: razorpayKey,
        subscription_id: res.subscription_id, // Use subscription ID instead of order ID
        name: 'Content Creator Premium',
        description: selectedPlan?.name || 'Content creator premium subscription',
        amount: selectedPlan?.amount ? selectedPlan.amount * 100 : 0, // Amount in paise
        currency: 'INR',
        prefill: {
          email: user.emailId || '',
          contact: user.phoneNumber || '',
          name: user.name || '',
        },
        theme: { color: colors.primary },
      };
      
      console.log('[ContentCreatorSubscription] Opening Razorpay with options:', options);
      
      RazorpayCheckout.open(options)
        .then(async (paymentData: any) => {
          console.log('[ContentCreatorSubscription] Payment successful:', paymentData);
          
          // Payment webhook will handle activation, just show success
          Alert.alert(
            'Success', 
            'Your content creator subscription has been activated!',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack()
              }
            ]
          );
        })
        .catch((error: any) => {
          console.error('[ContentCreatorSubscription] Payment failed:', error);
          Alert.alert('Payment Failed', `${error.description || error.message || 'Payment was cancelled or failed'}`);
        })
        .finally(() => {
          setPaymentProcessing(false);
        });
        
    } catch (error: any) {
      console.error('[ContentCreatorSubscription] Error:', error);
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
              <Text style={{ color: '#fff', marginTop: 4 }}>
                ₹{plan.amount} / {plan.billing_cycle || plan.plan_interval || 'month'}
              </Text>
              {plan.description && (
                <Text style={{ color: '#fff', marginTop: 4 }}>{plan.description}</Text>
              )}
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