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
        const response = await ApiService.getContentSubscriptionPlans();
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
        description: 'Your Content Creator subscription',
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

  const renderFeatureComparison = () => {
    const freeFeatures = [
      { label: 'Uploads on TipTube & TipShort', value: 'No earnings' },
      { label: 'Video upload type', value: 'Free videos only' },
      { label: 'Ad view earnings', value: '₹0.0006 (0.06 paisa)' },
      { label: 'Fan Call earnings', value: '₹0.006 per minute' },
      { label: 'Fan Video earnings', value: '₹1 per video' },
    ];
    
    const premiumFeatures = [
      { label: 'Uploads on TipTube & TipShort', value: 'Earnings available' },
      { label: 'Video upload type', value: 'Free & Paid videos' },
      { label: 'Ad view earnings', value: 'Upto ₹10,000 per add' },
      { label: 'Fan Call earnings', value: '₹4 per minute' },
      { label: 'Fan Video earnings', value: '₹8 per video' },
    ];

    return (
      <View style={styles.comparisonSection}>
        <Text style={[styles.comparisonTitle, { color: colors.text.primary }]}>
          Free vs Premium Benefits
        </Text>
        
        <View style={styles.comparisonContainer}>
          {/* Free Column */}
          <View style={[styles.comparisonColumn, { backgroundColor: isDarkMode ? colors.card : colors.surface }]}>
            <View style={styles.planTypeHeader}>
              <Text style={[styles.planTypeTitle, { color: colors.text.secondary }]}>FREE</Text>
              <View style={[styles.planTypeBadge, { backgroundColor: colors.text.tertiary + '20' }]}>
                <Text style={[styles.planTypeBadgeText, { color: colors.text.tertiary }]}>Current</Text>
              </View>
            </View>
            
            {freeFeatures.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={[styles.featureLabel, { color: colors.text.secondary }]}>
                  {feature.label}
                </Text>
                <Text style={[styles.featureValue, { color: colors.text.primary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {feature.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Premium Column */}
          <View style={[styles.comparisonColumn, { backgroundColor: colors.primary + '10', borderColor: colors.primary, borderWidth: 1 }]}
            pointerEvents={user?.isPremium ? 'none' : 'auto'}
          >
            <View style={styles.planTypeHeader}>
              <Text style={[styles.planTypeTitle, { color: colors.primary }]}>PREMIUM</Text>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.planTypeBadge}
              >
                <Text style={styles.premiumBadgeText}>Upgrade</Text>
              </LinearGradient>
            </View>
            
            {premiumFeatures.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={[styles.featureLabel, { color: colors.text.secondary }]}>
                  {feature.label}
                </Text>
                <Text style={[styles.featureValue, { color: colors.primary, fontWeight: '600' }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {feature.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
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
          <Text style={styles.headerTitle}>Unlock Premium Features</Text>
          <Text style={styles.headerSubtitle}>
            Join thousands of users enjoying premium benefits
          </Text>
          <View style={styles.premiumIcon}>
            <Icon name="star" size={32} color="#FFD700" />
          </View>
        </LinearGradient>
         */} 
        {/* Feature Comparison Section */}
        {renderFeatureComparison()}

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
                ₹{selectedPlan.amount}
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
  comparisonSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  comparisonTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  comparisonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  comparisonColumn: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  planTypeHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  featureRow: {
    marginBottom: 12,
  },
  featureLabel: {
    fontSize: 12,
    marginBottom: 2,
    lineHeight: 16,
  },
  featureValue: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
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

export default ContentCreatorSubscriptionScreen;