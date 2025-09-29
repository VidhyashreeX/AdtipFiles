import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import ApiService from '../../services/ApiService';

interface PremiumPlan {
  id: number;
  title: string;
  duration: string;
  price: number;
  originalPrice?: number;
  features: string[];
  isPopular?: boolean;
  savings?: string;
}

const PremiumPlansScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { balance, refreshBalance } = useWallet();

  const [selectedPlan, setSelectedPlan] = useState<number>(2); // Default to 6-month plan
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const plans: PremiumPlan[] = [
    {
      id: 1,
      title: '1 Month',
      duration: 'Monthly',
      price: 299,
      features: [
        '2x earning rates',
        'Priority support',
        'Premium badge',
        'Basic analytics'
      ]
    },
    {
      id: 2,
      title: '6 Months',
      duration: 'Semi-Annual',
      price: 1499,
      originalPrice: 1794,
      savings: 'Save ₹295',
      isPopular: true,
      features: [
        'All monthly benefits',
        'Monthly bonus rewards',
        'Advanced analytics',
        'Ad-free experience',
        '10% extra earnings'
      ]
    },
    {
      id: 3,
      title: '1 Year',
      duration: 'Annual',
      price: 2799,
      originalPrice: 3588,
      savings: 'Save ₹789',
      features: [
        'All 6-month benefits',
        'VIP community access',
        'Exclusive content',
        'Priority customer support',
        '15% extra earnings'
      ]
    }
  ];

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSubscribe = async () => {
    if (!selectedPlanData || !user?.id) {
      Alert.alert('Error', 'Please select a plan and ensure you are logged in.');
      return;
    }

    if (balance < selectedPlanData.price) {
      Alert.alert(
        'Insufficient Balance',
        `You need ₹${selectedPlanData.price} but only have ₹${balance}. Please add money to your wallet first.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Money', onPress: () => navigation.navigate('Wallet' as never) }
        ]
      );
      return;
    }

    Alert.alert(
      'Confirm Subscription',
      `Subscribe to ${selectedPlanData.title} plan for ₹${selectedPlanData.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Subscribe', onPress: confirmSubscription }
      ]
    );
  };

  const confirmSubscription = async () => {
    if (!selectedPlanData || !user?.id) return;

    setSubscribing(true);
    try {
      console.log('🔄 [PremiumPlansScreen] Starting subscription process:', {
        userId: user.id,
        planId: selectedPlan,
        price: selectedPlanData.price
      });

      const response = await ApiService.post('/upgradeuserpremium', {
        userId: user.id,
        planId: selectedPlan,
        amount: selectedPlanData.price,
        duration: selectedPlanData.duration
      });

      if (response.data && response.data.status === 200) {
        console.log('✅ [PremiumPlansScreen] Subscription successful');
        
        // Refresh wallet balance
        await refreshBalance();
        
        Alert.alert(
          'Success!',
          `You've successfully subscribed to the ${selectedPlanData.title} premium plan. Welcome to Premium!`,
          [
            { 
              text: 'Great!', 
              onPress: () => {
                // Navigate back to previous screen or to a success screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' as never }],
                });
              }
            }
          ]
        );
      } else {
        throw new Error(response.data?.message || 'Subscription failed');
      }
    } catch (error: any) {
      console.error('❌ [PremiumPlansScreen] Subscription error:', error);
      Alert.alert(
        'Subscription Failed',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubscribing(false);
    }
  };

  const renderPlanCard = (plan: PremiumPlan) => {
    const isSelected = selectedPlan === plan.id;
    
    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          {
            backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => setSelectedPlan(plan.id)}
        activeOpacity={0.8}
      >
        {plan.isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <View>
            <Text style={[styles.planTitle, { color: colors.text.primary }]}>
              {plan.title}
            </Text>
            <Text style={[styles.planDuration, { color: colors.text.secondary }]}>
              {plan.duration}
            </Text>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={[styles.planPrice, { color: colors.text.primary }]}>
              ₹{plan.price}
            </Text>
            {plan.originalPrice && (
              <Text style={[styles.originalPrice, { color: colors.text.tertiary }]}>
                ₹{plan.originalPrice}
              </Text>
            )}
          </View>
        </View>

        {plan.savings && (
          <View style={[styles.savingsBadge, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.savingsText, { color: colors.success }]}>
              {plan.savings}
            </Text>
          </View>
        )}

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Icon name="check" size={16} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.text.secondary }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
            <Icon name="check" size={20} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
        >
          <Icon name="chevron-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Choose Your Plan
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Balance */}
        <View style={[styles.balanceCard, { backgroundColor: isDarkMode ? colors.card : '#F8F9FA' }]}>
          <View style={styles.balanceHeader}>
            <Icon name="credit-card" size={20} color={colors.primary} />
            <Text style={[styles.balanceLabel, { color: colors.text.secondary }]}>
              Wallet Balance
            </Text>
          </View>
          <Text style={[styles.balanceAmount, { color: colors.text.primary }]}>
            ₹{balance}
          </Text>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Select Your Plan
          </Text>
          
          {plans.map(renderPlanCard)}
        </View>

        {/* Selected Plan Summary */}
        {selectedPlanData && (
          <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>
              Order Summary
            </Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>
                {selectedPlanData.title} Plan
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text.primary }]}>
                ₹{selectedPlanData.price}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryTotalLabel, { color: colors.text.primary }]}>
                Total
              </Text>
              <Text style={[styles.summaryTotalValue, { color: colors.primary }]}>
                ₹{selectedPlanData.price}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Subscribe Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            { 
              backgroundColor: colors.primary,
              opacity: subscribing ? 0.7 : 1
            }
          ]}
          onPress={handleSubscribe}
          disabled={subscribing}
          activeOpacity={0.8}
        >
          {subscribing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.subscribeButtonText}>
                Subscribe Now
              </Text>
              <Icon name="arrow-right" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.footerSubtext, { color: colors.text.tertiary }]}>
          Secure payment • Cancel anytime
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  balanceCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  plansContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    right: 20,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginTop: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  planDuration: {
    fontSize: 14,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 12,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  footerSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default PremiumPlansScreen;