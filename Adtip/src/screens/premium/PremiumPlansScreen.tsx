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
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../../components/common/Header';

const { width, height } = Dimensions.get('window');

const SubscriptionScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [apiCallTimeout, setApiCallTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      // Set a timeout to detect if API call is hanging
      const timeout = setTimeout(() => {
        console.warn('[PremiumPlansScreen] API call timeout - plans fetch taking too long');
        Alert.alert('Timeout', 'The request is taking too long. Please check your connection and try again.');
        setLoading(false);
      }, 30000); // 30 second timeout
      
      setApiCallTimeout(timeout);

      try {
        console.log('[PremiumPlansScreen] Fetching subscription plans...');
        
        // Test API connection first
        try {
          const testResponse = await fetch('https://api.adtip.in/api/subscription-plans', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${await AsyncStorage.getItem('accessToken')}`
            }
          });
          console.log('[PremiumPlansScreen] Direct fetch test - Status:', testResponse.status);
          const testData = await testResponse.json();
          console.log('[PremiumPlansScreen] Direct fetch test - Data:', testData);
        } catch (fetchError) {
          console.error('[PremiumPlansScreen] Direct fetch test failed:', fetchError);
        }
        
        // Try test endpoints first, then fallback to production
        let response;
        try {
          console.log('[PremiumPlansScreen] Trying test subscription plans first...');
          response = await ApiService.getSubscriptionPlansTest();
          console.log('[PremiumPlansScreen] Test plans response:', response);
        } catch (testError) {
          console.log('[PremiumPlansScreen] Test plans failed, trying production plans...');
          response = await ApiService.getSubscriptionPlans();
        }
        console.log('[PremiumPlansScreen] Plans response:', response);
        
        // Clear timeout since we got a response
        clearTimeout(timeout);
        setApiCallTimeout(null);
        
        if (response && response.status) {
          setPlans(response.plans || []);
          // Pre-select the middle plan
          if (response.plans && response.plans.length > 1) {
            setSelectedPlanId(response.plans[1].id);
          } else if (response.plans && response.plans.length > 0) {
            setSelectedPlanId(response.plans[0].id);
          }
        } else {
          console.error('[PremiumPlansScreen] API returned status false:', response);
          Alert.alert('Error', response?.message || 'Could not fetch subscription plans.');
        }
      } catch (error: any) {
        // Clear timeout on error
        clearTimeout(timeout);
        setApiCallTimeout(null);
        
        console.error('[PremiumPlansScreen] Error fetching plans:', error);
        console.error('[PremiumPlansScreen] Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: error.config
        });
        Alert.alert('Error', error.message || 'An error occurred while fetching plans.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();

    // Cleanup timeout on unmount
    return () => {
      if (apiCallTimeout) {
        clearTimeout(apiCallTimeout);
      }
    };
  }, []);

  const handlePayment = async () => {
    if (!selectedPlanId) {
      Alert.alert('No Plan Selected', 'Please select a subscription plan.');
      return;
    }

    if (!user?.id) {
        Alert.alert('Authentication Error', 'Could not identify user. Please log in again.');
        return;
    }
    
    setPaymentProcessing(true);

    // Set a timeout for payment setup API calls
    const paymentTimeout = setTimeout(() => {
      console.warn('[PremiumPlansScreen] Payment setup timeout');
      setPaymentProcessing(false);
      Alert.alert('Timeout', 'Payment setup is taking too long. Please try again.');
    }, 45000); // 45 second timeout for payment setup

    try {
      // Step 1: Create a subscription on Razorpay (no database storage yet)
      console.log('[PremiumPlansScreen] Creating subscription with plan_id:', selectedPlanId, 'user_id:', user.id);
      
      // Try test endpoint first, then fallback to production
      let subResponse;
      try {
        console.log('[PremiumPlansScreen] Trying test subscription creation first...');
        subResponse = await ApiService.createSubscriptionTest(selectedPlanId, user.id);
        console.log('[PremiumPlansScreen] Test subscription creation response:', subResponse);
      } catch (testError) {
        console.log('[PremiumPlansScreen] Test subscription failed, trying production...');
        subResponse = await ApiService.createSubscription(selectedPlanId, user.id);
      }
      console.log('[PremiumPlansScreen] Create subscription response:', subResponse);

      if (!subResponse || !subResponse.status || !subResponse.subscription_id) {
        console.error('[PremiumPlansScreen] Create subscription failed:', subResponse);
        throw new Error(subResponse?.message || 'Failed to create subscription.');
      }

      const { subscription_id } = subResponse;
      console.log('[PremiumPlansScreen] Subscription created with ID:', subscription_id);

      // Step 2: Fetch Razorpay key from backend
      console.log('[PremiumPlansScreen] Fetching Razorpay details...');
      
      // Try test endpoint first, then fallback to production
      let razorpayDetails;
      try {
        console.log('[PremiumPlansScreen] Trying test Razorpay details first...');
        razorpayDetails = await ApiService.getRazorpayDetailsTest();
        console.log('[PremiumPlansScreen] Test Razorpay details response:', razorpayDetails);
      } catch (testError) {
        console.log('[PremiumPlansScreen] Test Razorpay details failed, trying production...');
        razorpayDetails = await ApiService.getRazorpayDetails();
      }
      console.log('[PremiumPlansScreen] Razorpay details response:', razorpayDetails);
      const key = razorpayDetails?.api_key;
      if (!key) {
        console.error('[PremiumPlansScreen] No Razorpay key found:', razorpayDetails);
        throw new Error('Could not fetch Razorpay key.');
      }

      // Step 3: Open Razorpay Checkout
      const options = {
        key,
        subscription_id: subscription_id,
        name: 'Adtip Premium',
        description: 'Your premium subscription',
        prefill: {
          email: user.emailId,
          contact: user.mobile_number,
          name: user.name,
        },
        theme: { color: colors.primary },
      };

      console.log('Razorpay options:', options);
      RazorpayCheckout.open(options)
        .then(async (data: any) => {
            try {
              console.log('🔄 [SubscriptionScreen] Payment completed, verifying...', data);
              
              // Verify payment first
              const verificationResult = await ApiService.verifySubscriptionPayment({
                razorpay_payment_id: data.razorpay_payment_id,
                razorpay_subscription_id: data.razorpay_subscription_id,
                razorpay_signature: data.razorpay_signature,
                user_id: user.id,
                plan_id: selectedPlanId
              });
              
              if (!verificationResult.status) {
                throw new Error('Payment verification failed');
              }
              
              console.log('✅ [SubscriptionScreen] Payment verified successfully');
              
              // Only navigate on successful verification
              Alert.alert(
                'Success', 
                'Your premium subscription has been activated successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate to premium success or back to profile
                      navigation.navigate('PremiumUser');
                    }
                  }
                ]
              );
              
            } catch (error: any) {
              console.error('❌ [SubscriptionScreen] Payment verification failed:', error);
              Alert.alert(
                'Payment Verification Failed', 
                'Your payment was processed but verification failed. Please contact support.',
                [{ text: 'OK' }]
              );
            }
        })
        .catch((error: any) => {
            console.error('❌ [SubscriptionScreen] Payment failed:', error);
            // Clear payment timeout on payment completion
            clearTimeout(paymentTimeout);
            // Show user-friendly messages for payment cancelled or failed
            if (
              error?.code === 'BAD_REQUEST_ERROR' &&
              (error?.reason === 'payment_cancelled' || error?.description?.toLowerCase().includes('cancel'))
            ) {
              Alert.alert('Payment Cancelled', 'You cancelled the payment or did not complete it.', [{ text: 'OK' }]);
            } else {
              Alert.alert('Payment Failed', 'Something went wrong with your payment. Please try again.', [{ text: 'OK' }]);
            }
        })
        .finally(() => {
            // Clear payment timeout
            clearTimeout(paymentTimeout);
            setPaymentProcessing(false);
        });

    } catch (error: any) {
      // Clear payment timeout on error
      clearTimeout(paymentTimeout);
      
      console.error('[PremiumPlansScreen] Payment setup error:', error);
      console.error('[PremiumPlansScreen] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      setPaymentProcessing(false);
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    }
  };



  const renderPlan = (plan: any, index: number) => {
    const isSelected = plan.id === selectedPlanId;
    const isPopular = index === 1; // Assuming the middle plan is most popular

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planContainer,
          {
            backgroundColor: isSelected 
              ? (isDarkMode ? colors.primary + '20' : colors.primary + '10') 
              : (isDarkMode ? colors.card : colors.surface),
            borderColor: isSelected ? colors.primary : 'transparent',
          },
          isSelected && styles.selectedPlan,
          !isDarkMode && styles.shadowLight
        ]}
        onPress={() => setSelectedPlanId(plan.id)}
        activeOpacity={0.7}
      >
        {isPopular && (
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            style={styles.popularBadge}
          >
            <Text style={styles.popularText}>Most Popular</Text>
          </LinearGradient>
        )}
        
        <View style={styles.planHeader}>
          <View style={styles.planNameContainer}>
            <Text style={[styles.planName, { color: colors.text.primary }]}>
              {plan.name}
            </Text>
            <Text style={[styles.planDescription, { color: colors.text.secondary }]}>
              {plan.description}
            </Text>
          </View>
          
          <View style={[
            styles.radioCircle,
            {
              borderColor: isSelected ? colors.primary : colors.text.tertiary,
              backgroundColor: isSelected ? colors.primary : 'transparent'
            }
          ]}>
            {isSelected && <Icon name="check" size={12} color="#fff" />}
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={[styles.planPrice, { color: colors.primary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            ₹{plan.amount}
          </Text>
          <Text style={[styles.planInterval, { color: colors.text.tertiary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            / {plan.interval === 1 ? '' : plan.interval} {plan.period}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Subscription Plans" showSearch={false} showWallet={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading subscription plans...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        backgroundColor={colors.background} 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
      />
      
      <Header title="Subscription Plans" showSearch={false} showWallet={false} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section 
        <LinearGradient
          colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667eea', '#764ba2']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Choose Your Premium Plan</Text>
          <Text style={styles.headerSubtitle}>
            Select the perfect plan for your earning goals
          </Text>
          <View style={styles.premiumIcon}>
            <Icon name="star" size={32} color="#FFD700" />
          </View>
        </LinearGradient>*/}

        {/* Plans Section */}
        <View style={styles.plansSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Choose Your Plan
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
            Cancel anytime. No hidden fees.
          </Text>
          
          <View style={styles.plansContainer}>
            {plans.map(renderPlan)}
          </View>
        </View>

        {/* Selected Plan Summary */}
        {selectedPlan && (
          <View style={[styles.summaryContainer, { backgroundColor: isDarkMode ? colors.card : colors.surface }]}>
            <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>
              Order Summary
            </Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                Plan: {selectedPlan.name}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                ₹{selectedPlan.amount}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryTotal, { color: colors.text.primary }]}>
                Total
              </Text>
              <Text style={[styles.summaryTotal, { color: colors.primary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                ₹{selectedPlan.amount} + GST
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.paymentButton, { opacity: paymentProcessing ? 0.6 : 1 }]}
          onPress={handlePayment}
          disabled={paymentProcessing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {paymentProcessing ? (
              <View style={styles.loadingButtonContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.loadingButtonText}>Processing...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Icon name="credit-card" size={18} color="#fff" />
                <Text style={styles.paymentButtonText}>
                  Continue to Payment
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Icon name="shield" size={14} color={colors.text.tertiary} />
          <Text style={[styles.securityText, { color: colors.text.tertiary }]}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerGradient: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    maxWidth: '85%',
  },
  premiumIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
  },

  plansSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  plansContainer: {
    gap: 16,
  },
  planContainer: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedPlan: {
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  shadowLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 14,
  },
  popularText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planNameContainer: {
    flex: 1,
    marginRight: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 8,
  },
  planInterval: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryContainer: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 12,
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  paymentButton: {
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
  paymentButtonText: {
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
});

export default SubscriptionScreen;