// src/screens/packages/CheckoutScreen.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import {useTheme} from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {colors} = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('card');

  const routeParams = route.params as any;
  const packageData = routeParams?.package;
  const billingData = routeParams?.billing;
  const totalPrice = routeParams?.totalPrice;

  const paymentMethods: PaymentMethod[] = [
    {id: 'card', name: 'Credit/Debit Card', icon: 'credit-card'},
    {id: 'paypal', name: 'PayPal', icon: 'smartphone'},
    {id: 'apple', name: 'Apple Pay', icon: 'smartphone'},
    {id: 'google', name: 'Google Pay', icon: 'smartphone'},
  ];

  const handleCheckout = async () => {
    try {
      setLoading(true);

      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Payment Successful!',
        `Your ${packageData?.name} plan has been activated.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main' as never),
          },
        ],
      );
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Failed',
        'Please try again or use a different payment method.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper to get dynamic style for checkout button
  function getCheckoutButtonStyle(baseStyle: any, color: string, isLoading: boolean) {
    return [baseStyle, {backgroundColor: color, opacity: isLoading ? 0.7 : 1}];
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Checkout" showBackButton />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={[styles.section, {backgroundColor: colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
            Order Summary
          </Text>
          <View style={styles.orderItem}>
            <Text style={[styles.orderItemName, {color: colors.text.primary}]}>
              {packageData?.name} Plan - {billingData?.label}
            </Text>
            <Text style={[styles.orderItemPrice, {color: colors.text.primary}]}>
              ${totalPrice?.toFixed(2)}
            </Text>
          </View>
          <View
            style={[styles.totalRow, {borderTopColor: colors.border}]}>
            <Text style={[styles.totalLabel, {color: colors.text.primary}]}>
              Total
            </Text>
            <Text style={[styles.totalPrice, {color: colors.text.primary}]}>
              ${totalPrice?.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
            Payment Method
          </Text>
          {paymentMethods.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                {
                  backgroundColor: colors.surface,
                  borderColor:
                    selectedPayment === method.id
                      ? colors.primary
                      : colors.border,
                },
              ]}
              onPress={() => setSelectedPayment(method.id)}>
              <Icon
                name={method.icon}
                size={20}
                color={colors.text.secondary}
              />
              <Text
                style={[
                  styles.paymentMethodName,
                  {color: colors.text.primary},
                ]}>
                {method.name}
              </Text>
              {selectedPayment === method.id && (
                <Icon name="check-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Form */}
        {selectedPayment === 'card' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
              Card Information
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text.primary,
                },
              ]}
              placeholder="Card Number"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
            />
            <View style={styles.cardRow}>
              <TextInput
                style={[
                  styles.halfInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text.primary,
                  },
                ]}
                placeholder="MM/YY"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
              />
              <TextInput
                style={[
                  styles.halfInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text.primary,
                  },
                ]}
                placeholder="CVC"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
              />
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text.primary,
                },
              ]}
              placeholder="Cardholder Name"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
        )}

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={[styles.termsText, {color: colors.text.tertiary}]}>
            By completing this purchase, you agree to our Terms of Service and
            Privacy Policy. Your subscription will automatically renew unless
            cancelled.
          </Text>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={[styles.bottomContainer, {backgroundColor: colors.surface}]}>
        <TouchableOpacity
          style={getCheckoutButtonStyle(styles.checkoutButton, colors.primary, loading)}
          onPress={handleCheckout}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={[styles.checkoutButtonText, {color: colors.white}]}>
              Complete Purchase - ${totalPrice?.toFixed(2)}
            </Text>
          )}
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
  section: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderItemName: {
    fontSize: 14,
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  paymentMethodName: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  termsSection: {
    padding: 16,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  checkoutButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen;
