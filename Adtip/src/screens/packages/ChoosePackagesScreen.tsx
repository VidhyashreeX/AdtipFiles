// src/screens/packages/ChoosePackagesScreen.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';

interface BillingPeriod {
  id: string;
  label: string;
  months: number;
  discount?: number;
  popular?: boolean;
}

const ChoosePackagesScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {colors} = useTheme();
  const [selectedBilling, setSelectedBilling] = useState<string>('monthly');

  const packageData = (route.params as any)?.package;

  const billingPeriods: BillingPeriod[] = [
    {
      id: 'monthly',
      label: 'Monthly',
      months: 1,
    },
    {
      id: 'quarterly',
      label: 'Quarterly',
      months: 3,
      discount: 10,
    },
    {
      id: 'yearly',
      label: 'Yearly',
      months: 12,
      discount: 20,
      popular: true,
    },
  ];

  const calculatePrice = (basePrice: number, billing: BillingPeriod) => {
    const totalPrice = basePrice * billing.months;
    if (billing.discount) {
      return totalPrice * (1 - billing.discount / 100);
    }
    return totalPrice;
  };

  const calculateMonthlyPrice = (totalPrice: number, months: number) => {
    return totalPrice / months;
  };

  const handleContinue = () => {
    const selectedBillingPeriod = billingPeriods.find(
      b => b.id === selectedBilling,
    );
    const totalPrice = calculatePrice(
      packageData.price,
      selectedBillingPeriod!,
    );

    // @ts-ignore
    navigation.navigate('Checkout', {
      package: packageData,
      billing: selectedBillingPeriod,
      totalPrice,
    });
  };

  const getBillingOptionStyle = (isSelected: boolean) => ({
    backgroundColor: colors.surface,
    borderColor: isSelected ? colors.primary : colors.border,
    borderWidth: isSelected ? 2 : 1, // always a number
  });

  if (!packageData) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="Package Options"/>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, {color: colors.text.secondary}]}>
            Package information not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Package Options"/>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Package Summary */}
        <View
          style={[styles.packageSummary, {backgroundColor: colors.surface}]}>
          <Text style={[styles.packageName, {color: colors.text.primary}]}>
            {packageData.name} Plan
          </Text>
          <Text
            style={[styles.packageDescription, {color: colors.text.secondary}]}>
            {packageData.description}
          </Text>
        </View>

        {/* Billing Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
            Choose Billing Period
          </Text>
          <Text
            style={[styles.sectionSubtitle, {color: colors.text.secondary}]}>
            Save more with longer commitments
          </Text>

          <View style={styles.billingOptions}>
            {billingPeriods.map(billing => {
              const totalPrice = calculatePrice(packageData.price, billing);
              const monthlyPrice = calculateMonthlyPrice(
                totalPrice,
                billing.months,
              );
              const isSelected = selectedBilling === billing.id;

              return (
                <TouchableOpacity
                  key={billing.id}
                  style={[
                    styles.billingOption,
                    getBillingOptionStyle(isSelected),
                  ]}
                  onPress={() => setSelectedBilling(billing.id)}>
                  {billing.popular && (
                    <View
                      style={[
                        styles.popularBadge,
                        {backgroundColor: colors.primary},
                      ]}>
                      <Text
                        style={[
                          styles.popularBadgeText,
                          {color: colors.white},
                        ]}>
                        Most Popular
                      </Text>
                    </View>
                  )}

                  <View style={styles.billingHeader}>
                    <Text
                      style={[
                        styles.billingLabel,
                        {color: colors.text.primary},
                      ]}>
                      {billing.label}
                    </Text>
                    {billing.discount && (
                      <View
                        style={[
                          styles.discountBadge,
                          {backgroundColor: colors.success},
                        ]}>
                        <Text
                          style={[styles.discountText, {color: colors.white}]}>
                          Save {billing.discount}%
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.priceInfo}>
                    <Text
                      style={[styles.totalPrice, {color: colors.text.primary}]}>
                      ${totalPrice.toFixed(2)}
                    </Text>
                    <Text
                      style={[
                        styles.periodText,
                        {color: colors.text.secondary},
                      ]}>
                      for {billing.months} month{billing.months > 1 ? 's' : ''}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.monthlyEquivalent,
                      {color: colors.text.tertiary},
                    ]}>
                    ${monthlyPrice.toFixed(2)}/month
                  </Text>

                  {isSelected && (
                    <View style={styles.selectedIcon}>
                      <Icon
                        name="check-circle"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Features Reminder */}
        <View style={styles.featuresSection}>
          <Text style={[styles.featuresTitle, {color: colors.text.primary}]}>
            What's included:
          </Text>
          {packageData.features.map((feature: string, index: number) => (
            <View key={index} style={styles.featureItem}>
              <Icon
                name="check"
                size={16}
                color={colors.success}
                style={styles.checkIcon}
              />
              <Text
                style={[styles.featureText, {color: colors.text.secondary}]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={[styles.termsText, {color: colors.text.tertiary}]}>
            • You can cancel or change your plan at any time
          </Text>
          <Text style={[styles.termsText, {color: colors.text.tertiary}]}>
            • Refunds available within 14 days of purchase
          </Text>
          <Text style={[styles.termsText, {color: colors.text.tertiary}]}>
            • All plans include 24/7 customer support
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.bottomContainer, {backgroundColor: colors.surface}]}>
        <TouchableOpacity
          style={[styles.continueButton, {backgroundColor: colors.primary}]}
          onPress={handleContinue}>
          <Text style={[styles.continueButtonText, {color: colors.white}]}>
            Continue to Payment
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  packageSummary: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  billingOptions: {
    gap: 12,
  },
  billingOption: {
    padding: 16,
    borderRadius: 8,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  billingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  periodText: {
    fontSize: 14,
  },
  monthlyEquivalent: {
    fontSize: 12,
  },
  selectedIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  termsSection: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 12,
    marginBottom: 4,
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  continueButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChoosePackagesScreen;