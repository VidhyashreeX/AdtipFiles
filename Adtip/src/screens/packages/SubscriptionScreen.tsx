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
  Platform
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const SubscriptionScreen = () => {
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
        const response = await ApiService.getSubscriptionPlans();
        if (response.status) {
          setPlans(response.plans);
          // Pre-select the middle plan
          if (response.plans.length > 1) {
            setSelectedPlanId(response.plans[1].id);
          } else if (response.plans.length > 0) {
            setSelectedPlanId(response.plans[0].id);
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
      // Step 1: Create a subscription on your backend
      const subResponse = await ApiService.createSubscription(selectedPlanId, user.id);

      if (!subResponse.status || !subResponse.subscription_id) {
        throw new Error(subResponse.message || 'Failed to create subscription.');
      }

      const { subscription_id } = subResponse;

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
      RazorpayCheckout.open(options)
        .then((data: any) => {
            // Payment is successful, webhook will handle the rest.
            Alert.alert('Success', 'Your subscription is being processed! You will be notified once it is active.');
            navigation.goBack();
        })
        .catch((error: any) => {
            // handle failure
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

  const renderPlan = (plan: any, index: number) => {
    const isSelected = plan.id === selectedPlanId;
    const isPopular = index === 1; // Assuming the middle plan is most popular

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planContainer,
          {
            backgroundColor: isDarkMode ? colors.card : colors.background,
            borderColor: isSelected ? colors.primary : (isDarkMode ? colors.border : 'transparent'),
            transform: [{ scale: isSelected ? 1.0 : 0.95 }],
          },
          isDarkMode ? styles.shadowDark : styles.shadowLight
        ]}
        onPress={() => setSelectedPlanId(plan.id)}
        activeOpacity={0.9}
      >
        {isPopular && (
            <View style={[styles.popularBadge, { backgroundColor: colors.secondary}]}>
                <Text style={styles.popularText}>Most Popular</Text>
            </View>
        )}
        <View style={styles.radioCircle}>
          {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
        </View>
        <Text style={[styles.planName, { color: colors.text.primary }]}>{plan.name}</Text>
        <Text style={[styles.planPrice, { color: colors.primary }]}>
          ₹{plan.amount} <Text style={[styles.planInterval, { color: colors.text.secondary }]}>/ {plan.interval === 1 ? '' : plan.interval} {plan.period}</Text>
        </Text>
        <Text style={[styles.planDescription, { color: colors.text.tertiary }]}>{plan.description}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>Choose Your Plan</Text>
            <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                Join Adtip Premium to unlock exclusive features. Cancel anytime.
            </Text>
        </View>
      
      <View style={styles.plansWrapper}>
        {plans.map(renderPlan)}
      </View>

      <TouchableOpacity
        style={[styles.button, { opacity: paymentProcessing ? 0.6 : 1 }]}
        onPress={handlePayment}
        disabled={paymentProcessing}
      >
        <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.gradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
        >
        {paymentProcessing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Confirm Payment</Text>
        )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Icon name="shield" size={16} color={colors.text.tertiary} />
        <Text style={[styles.footerText, { color: colors.text.tertiary }]}>
            Secure payment via Razorpay.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '90%',
  },
  plansWrapper: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  planContainer: {
    width: width * 0.9,
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
  },
  shadowLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  shadowDark: {
    borderColor: '#333',
    borderWidth: 1,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
  },
  popularText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  radioCircle: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planInterval: {
    fontSize: 16,
    fontWeight: '500',
  },
  planDescription: {
    fontSize: 14,
    marginTop: 8,
  },
  button: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 12,
    height: 50,
  },
  gradient: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 12,
  },
});

export default SubscriptionScreen; 