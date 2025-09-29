import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const PremiumBenefitsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();

  const benefits = [
    {
      icon: 'dollar-sign',
      title: 'Higher Earning Rates',
      description: 'Earn 2x more from watching content and completing tasks',
      highlight: '2x Rewards'
    },
    {
      icon: 'zap',
      title: 'Priority Support',
      description: 'Get faster response times and dedicated customer support',
      highlight: 'VIP Support'
    },
    {
      icon: 'star',
      title: 'Exclusive Content',
      description: 'Access premium videos and content before others',
      highlight: 'Early Access'
    },
    {
      icon: 'award',
      title: 'Premium Badge',
      description: 'Show off your premium status with a special badge',
      highlight: 'Status Symbol'
    },
    {
      icon: 'gift',
      title: 'Monthly Bonuses',
      description: 'Receive exclusive bonuses and rewards every month',
      highlight: 'Extra Rewards'
    },
    {
      icon: 'trending-up',
      title: 'Advanced Analytics',
      description: 'Track your earnings with detailed analytics dashboard',
      highlight: 'Pro Analytics'
    },
    {
      icon: 'users',
      title: 'Community Access',
      description: 'Join exclusive premium user community and events',
      highlight: 'VIP Community'
    },
    {
      icon: 'shield',
      title: 'Ad-Free Experience',
      description: 'Enjoy uninterrupted browsing with reduced advertisements',
      highlight: 'Clean UI'
    }
  ];

  const handleContinue = () => {
    navigation.navigate('PremiumPlansScreen' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderFeatureComparison = () => {
    const freeFeatures = [
      { label: 'Earn per ad view', value: '₹0.03 Rupees' },
      { label: 'Platform fee', value: '60% +18% GST' },
      { label: 'Tip Call charge', value: '₹7 per minute' },
      { label: 'Maximum earnings', value: 'Upto ₹2000' },
      { label: 'Withdrawal processing', value: '30 business days' },
      { label: 'Tip Call acceptance', value: '₹1 per call' },
      { label: 'Minimum withdrawal', value: '₹2000' },
      { label: 'Creator earnings withdrawal', value: '₹5000' },
    ];

    const premiumFeatures = [
      { label: 'Earn per ad view', value: 'Upto ₹10' },
      { label: 'Platform fee', value: '30% +18% GST' },
      { label: 'Tip Call charge', value: '₹4 per minute' },
      { label: 'Maximum earnings', value: 'Upto ₹20000' },
      { label: 'Withdrawal processing', value: '14 business days' },
      { label: 'Tip Call acceptance', value: '₹2 per call' },
      { label: 'Minimum withdrawal', value: '₹1000' },
      { label: 'Creator earnings withdrawal', value: '₹1000' },
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
            pointerEvents={user?.is_premium ? 'none' : 'auto'}
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
          Premium Benefits
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#FF6B35', '#FF8E53']}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <Icon name="star" size={48} color="#FFFFFF" />
            <Text style={styles.heroTitle}>Unlock Premium</Text>
            <Text style={styles.heroSubtitle}>
              Get access to exclusive features and maximize your earning potential
            </Text>
          </View>
        </LinearGradient>

        {/* Feature Comparison Section */}
        {renderFeatureComparison()}

        {/* Benefits Grid */}
        <View style={styles.benefitsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            What You'll Get
          </Text>
          
          {benefits.map((benefit, index) => (
            <View 
              key={index}
              style={[
                styles.benefitCard,
                { 
                  backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
                  borderColor: colors.border
                }
              ]}
            >
              <View style={styles.benefitHeader}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Icon name={benefit.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.benefitInfo}>
                  <Text style={[styles.benefitTitle, { color: colors.text.primary }]}>
                    {benefit.title}
                  </Text>
                  <Text style={[styles.benefitDescription, { color: colors.text.secondary }]}>
                    {benefit.description}
                  </Text>
                </View>
              </View>
              <View style={[styles.highlightBadge, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.highlightText, { color: colors.success }]}>
                  {benefit.highlight}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Testimonial Section */}
        <View style={[styles.testimonialSection, { backgroundColor: isDarkMode ? colors.card : '#F8F9FA' }]}>
          <Text style={[styles.testimonialTitle, { color: colors.text.primary }]}>
            "Premium membership changed my earning game!"
          </Text>
          <Text style={[styles.testimonialAuthor, { color: colors.text.secondary }]}>
            - Premium User since 2024
          </Text>
        </View>

      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            View Premium Plans
          </Text>
          <Icon name="chevron-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={[styles.ctaSubtext, { color: colors.text.tertiary }]}>
          Cancel anytime • No hidden fees
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
  heroSection: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroContent: {
    padding: 32,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  benefitsContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  benefitCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitInfo: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  highlightBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '600',
  },
  testimonialSection: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  testimonialTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  testimonialAuthor: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  ctaSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Feature Comparison Styles
  comparisonSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  comparisonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  comparisonColumn: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  planTypeHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  planTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  planTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  planTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  featureRow: {
    marginBottom: 10,
  },
  featureLabel: {
    fontSize: 11,
    marginBottom: 2,
    lineHeight: 14,
  },
  featureValue: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});

export default PremiumBenefitsScreen;