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
  const [plansWithGST, setPlansWithGST] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Fetch both regular plans (for UI display) and GST plans (for payment)
        const [regularResponse, gstResponse] = await Promise.all([
          ApiService.getSubscriptionPlans(),
          ApiService.getSubscriptionPlansWithGST()
        ]);

        if (regularResponse.status && gstResponse.status) {
          setPlans(regularResponse.plans);
          setPlansWithGST(gstResponse.plans);
          
          // Pre-select the middle plan
          if (regularResponse.plans.length > 1) {
            setSelectedPlanId(regularResponse.plans[1].id);
          } else if (regularResponse.plans.length > 0) {
            setSelectedPlanId(regularResponse.plans[0].id);
          }
        } else {
          Alert.alert('Error', 'Could not fetch subscription plans.');
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
      Alert.alert('No Plan Selected', 'Please select a subscription plan.');
      return;
    }

    if (!user?.id) {
        Alert.alert('Authentication Error', 'Could not identify user. Please log in again.');
        return;
    }
    
    setPaymentProcessing(true);

    try {
      // Step 1: Create a subscription on Razorpay (no database storage yet)
      const subResponse = await ApiService.createSubscription(selectedPlanId, user.id);

      if (!subResponse.status || !subResponse.subscription_id) {
        throw new Error(subResponse.message || 'Failed to create subscription.');
      }

      const { subscription_id, amount_details } = subResponse;

      // Step 2: Fetch Razorpay key from backend
      const razorpayDetails = await ApiService.getRazorpayDetails();
      const key = razorpayDetails.api_key;
      if (!key) {
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
      console.log('Amount details:', amount_details);
      
      RazorpayCheckout.open(options)
        .then((data: any) => {
            // Payment is successful, webhook will handle database storage
            Alert.alert('Success', 'Your subscription is being processed! You will be notified once it is active.');
            navigation.goBack();
        })
        .catch((error: any) => {
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
            setPaymentProcessing(false);
        });

    } catch (error: any) {
      setPaymentProcessing(false);
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    }
  };

  const renderPlan = (plan: any, index: number) => {
    const isSelected = selectedPlanId === plan.id;
    const gstPlan = plansWithGST.find(gstPlan => gstPlan.id === plan.id);
    
    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          {
            backgroundColor: isSelected ? colors.primary : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => setSelectedPlanId(plan.id)}
        activeOpacity={0.8}
      >
        <View style={styles.planHeader}>
          <Text
            style={[
              styles.planName,
              { color: isSelected ? '#FFFFFF' : colors.text.primary },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {plan.name}
          </Text>
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Icon name="check" size={16} color="#FFFFFF" />
            </View>
          )}
        </View>

        <Text
          style={[
            styles.planDescription,
            { color: isSelected ? '#FFFFFF' : colors.text.secondary },
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {plan.description}
        </Text>

        <View style={styles.priceContainer}>
          <Text style={[styles.planPrice, { color: isSelected ? '#FFFFFF' : colors.primary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            ₹{plan.amount}
          </Text>
          <Text style={[styles.planInterval, { color: isSelected ? '#FFFFFF' : colors.text.tertiary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            / {plan.interval === 1 ? '' : plan.interval} {plan.period}
          </Text>
        </View>

        {/* Show GST breakdown if available */}
        {gstPlan && (
          <View style={styles.gstBreakdown}>
            <Text style={[styles.gstText, { color: isSelected ? '#FFFFFF' : colors.text.secondary }]}>
              Base: ₹{gstPlan.amount} + GST (18%): ₹{gstPlan.gst_amount / 100}
            </Text>
            <Text style={[styles.totalText, { color: isSelected ? '#FFFFFF' : colors.primary }]}>
              Total: ₹{gstPlan.amount_with_gst / 100}
            </Text>
          </View>
        )}
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
  const selectedGstPlan = plansWithGST.find(plan => plan.id === selectedPlanId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Subscription Plans" showSearch={false} showWallet={false} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Choose Your Premium Plan
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
            Unlock premium features and enhance your experience
          </Text>
        </View>

        <View style={styles.plansContainer}>
          {plans.map((plan, index) => renderPlan(plan, index))}
        </View>

        {selectedPlan && (
          <View style={[styles.selectedPlanInfo, { backgroundColor: colors.card }]}>
            <Text style={[styles.selectedPlanTitle, { color: colors.text.primary }]}>
              Selected Plan: {selectedPlan.name}
            </Text>
            <Text style={[styles.selectedPlanPrice, { color: colors.primary }]}>
              ₹{selectedPlan.amount} / {selectedPlan.period} {selectedPlan.interval}
            </Text>
            {selectedGstPlan && (
              <View style={styles.selectedPlanGST}>
                <Text style={[styles.gstBreakdownText, { color: colors.text.secondary }]}>
                  Price Breakdown:
                </Text>
                <Text style={[styles.gstBreakdownText, { color: colors.text.secondary }]}>
                  Base Amount: ₹{selectedGstPlan.amount}
                </Text>
                <Text style={[styles.gstBreakdownText, { color: colors.text.secondary }]}>
                  GST (18%): ₹{selectedGstPlan.gst_amount / 100}
                </Text>
                <Text style={[styles.gstTotalText, { color: colors.primary }]}>
                  Total Amount: ₹{selectedGstPlan.amount_with_gst / 100}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  planCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  planInterval: {
    fontSize: 16,
    marginLeft: 4,
  },
  gstBreakdown: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  gstText: {
    fontSize: 12,
    marginBottom: 2,
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedPlanInfo: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedPlanTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedPlanPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectedPlanGST: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  gstBreakdownText: {
    fontSize: 12,
    marginBottom: 2,
  },
  gstTotalText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  paymentButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    fontSize: 12,
    marginLeft: 4,
  },
});

export default SubscriptionScreen;