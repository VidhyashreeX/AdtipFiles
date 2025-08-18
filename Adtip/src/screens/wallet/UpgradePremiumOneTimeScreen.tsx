/**
 * One-Time Premium Upgrade Screen
 * 
 * This screen allows users to purchase premium plans with one-time payments
 * instead of subscription-based payments. It uses the addfunds-style flow
 * for payment processing.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import { Logger } from '../../utils/ProductionLogger';

interface PremiumPlan {
  id: number;
  name: string;
  description: string;
  duration_months: number;
  original_price: number;
  discounted_price: number;
  features: string[];
  is_popular: boolean;
  monthly_savings: number;
  total_savings: number;
  savings_percentage: number;
}

const UpgradePremiumOneTimeScreen: React.FC = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(null);

  useEffect(() => {
    loadPremiumPlans();
  }, []);

  const loadPremiumPlans = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getOneTimePremiumPlans();
      
      if (response.status) {
        setPlans(response.data);
        Logger.info('UpgradePremiumOneTime', 'Premium plans loaded successfully', {
          plansCount: response.data.length
        });
      } else {
        throw new Error(response.message || 'Failed to load premium plans');
      }
    } catch (error) {
      Logger.error('UpgradePremiumOneTime', 'Error loading premium plans', error);
      Alert.alert('Error', 'Failed to load premium plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchasePlan = async (plan: PremiumPlan) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setPurchasing(true);
      setSelectedPlan(plan);

      Logger.info('UpgradePremiumOneTime', 'Starting premium purchase', {
        planId: plan.id,
        planName: plan.name,
        amount: plan.discounted_price
      });

      // Step 1: Get Razorpay key
      const keyResponse = await ApiService.getRazorpayDetails();
      if (!keyResponse.api_key) {
        throw new Error('Failed to get Razorpay key');
      }

      // Step 2: Create Razorpay order
      const orderResponse = await ApiService.createRazorpayOrder({
        amount: plan.discounted_price,
        currency: 'INR',
        user_id: parseInt(user.id)
      });

      if (!orderResponse.status || !orderResponse.data?.id) {
        throw new Error('Failed to create payment order');
      }

      const orderId = orderResponse.data.id;
      const orderAmount = orderResponse.data.amount;

      // Step 3: Open Razorpay checkout
      RazorpayCheckout.open({
        key: keyResponse.api_key,
        amount: orderAmount,
        currency: 'INR',
        name: 'Adtip Premium',
        description: `${plan.name} - ${plan.duration_months} month(s)`,
        order_id: orderId,
        prefill: {
          email: user.email || '',
          contact: user.phone || '',
          name: user.name || '',
        },
        theme: { color: colors.primary },
      })
        .then(async (response: any) => {
          try {
            Logger.info('UpgradePremiumOneTime', 'Payment successful', {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id
            });

            // Step 4: Verify payment
            const verifyResponse = await ApiService.verifyRazorpayPayment({
              transaction_for: 'premium_onetime',
              order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: plan.discounted_price,
              currency: 'INR',
              user_id: parseInt(user.id),
              payment_status: 'success',
              plan_id: plan.id
            });

            if (!verifyResponse.status) {
              throw new Error('Payment verification failed');
            }

            // Step 5: Purchase premium
            const purchaseResponse = await ApiService.purchasePremiumOneTime({
              user_id: parseInt(user.id),
              plan_id: plan.id,
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              amount: plan.discounted_price,
              payment_status: 'success'
            });

            if (!purchaseResponse.status) {
              throw new Error('Premium activation failed');
            }

            Logger.info('UpgradePremiumOneTime', 'Premium purchase completed successfully', {
              premiumId: purchaseResponse.data.premium_id,
              expiresAt: purchaseResponse.data.expires_at
            });

            Alert.alert(
              'Premium Activated!',
              `Your ${plan.name} has been activated successfully. Enjoy premium features for ${plan.duration_months} month(s)!`,
              [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack()
                }
              ]
            );

          } catch (error) {
            Logger.error('UpgradePremiumOneTime', 'Error processing payment', error);
            Alert.alert('Payment Error', 'Payment was successful but premium activation failed. Please contact support.');
          }
        })
        .catch((error: any) => {
          Logger.error('UpgradePremiumOneTime', 'Payment cancelled or failed', error);
          if (error.code !== 'payment_cancelled') {
            Alert.alert('Payment Failed', 'Payment could not be processed. Please try again.');
          }
        });

    } catch (error) {
      Logger.error('UpgradePremiumOneTime', 'Error initiating payment', error);
      Alert.alert('Error', 'Failed to initiate payment. Please try again.');
    } finally {
      setPurchasing(false);
      setSelectedPlan(null);
    }
  };

  const renderPlanCard = (plan: PremiumPlan) => (
    <View
      key={plan.id}
      style={[
        styles.planCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        plan.is_popular && { borderColor: colors.primary, borderWidth: 2 }
      ]}
    >
      {plan.is_popular && (
        <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.popularText}>Most Popular</Text>
        </View>
      )}

      <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
      <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
        {plan.description}
      </Text>

      <View style={styles.priceContainer}>
        <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
          ₹{plan.original_price}
        </Text>
        <Text style={[styles.discountedPrice, { color: colors.primary }]}>
          ₹{plan.discounted_price}
        </Text>
        <View style={[styles.savingsBadge, { backgroundColor: colors.success }]}>
          <Text style={styles.savingsText}>{plan.savings_percentage}% OFF</Text>
        </View>
      </View>

      <Text style={[styles.durationText, { color: colors.text }]}>
        {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''} access
      </Text>

      <View style={styles.featuresContainer}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
              ✓ {feature}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.purchaseButton,
          { backgroundColor: plan.is_popular ? colors.primary : colors.border },
          purchasing && selectedPlan?.id === plan.id && styles.purchasingButton
        ]}
        onPress={() => handlePurchasePlan(plan)}
        disabled={purchasing}
      >
        {purchasing && selectedPlan?.id === plan.id ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={[
            styles.purchaseButtonText,
            { color: plan.is_popular ? 'white' : colors.text }
          ]}>
            Purchase Now
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading premium plans...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Upgrade to Premium
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choose a plan and enjoy premium features with one-time payment
          </Text>
        </View>

        <View style={styles.plansContainer}>
          {plans.map(renderPlanCard)}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            • No recurring charges • Cancel anytime • Instant activation
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  plansContainer: {
    padding: 16,
  },
  planCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  planDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 12,
  },
  savingsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  savingsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
  },
  purchaseButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchasingButton: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default UpgradePremiumOneTimeScreen;
