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

  const offers = [
    {id: 'offer1', description: 'Upto ₹200 cashback via CRE...'},
  ];
  const recommendedMethods = [
    {id: 'google', name: 'UPI - Google Pay', icon: 'google'},
    {id: 'phonepe', name: 'UPI - PhonePe', icon: 'phone'},
  ];
  const allPaymentOptions = [
    {id: 'upi', name: 'UPI', description: 'Upto ₹200 cashback', icon: 'upi'},
    {id: 'phonepe', name: 'PhonePe', icon: 'phone'},
    {id: 'google', name: 'Google Pay', icon: 'google'},
    {id: 'apps', name: 'Apps & UPI ID', icon: 'apps'},
    {id: 'cards', name: 'Cards', description: 'Upto 1.5% savings with NeuCard', icon: 'credit-card'},
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

  // Replace 'light' property usage with valid logic
  const borderColor = colors.border || '#ccc';

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Payment Options" showBackButton />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Available Offers */}
        <View style={[styles.section, {backgroundColor: colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
            Available Offers
          </Text>
          <View style={styles.offerRow}>
            <Text style={[styles.offerText, {color: colors.text.primary}]}>
              Upto Rs 200 cashback via CRED
            </Text>
            <TouchableOpacity>
              <Text style={[styles.offerLink, {color: colors.primary}]}>
                View all
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recommended Payment Methods */}
        <View style={[styles.section, {backgroundColor: colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
            Recommended
          </Text>
          {allPaymentOptions.slice(0, 2).map(method => (
            <TouchableOpacity
              key={method.id}
              style={[styles.paymentMethod, {backgroundColor: colors.surface}]}
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
            </TouchableOpacity>
          ))}
        </View>

        {/* All Payment Options */}
        <View style={[styles.section, {backgroundColor: colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>
            All Payment Options
          </Text>
          {allPaymentOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[styles.paymentMethod, {
                backgroundColor: colors.surface,
                borderColor: selectedPayment === option.id ? colors.primary : borderColor,
              }]}
              onPress={() => setSelectedPayment(option.id)}>
              <Icon
                name={option.icon}
                size={20}
                color={colors.text.secondary}
              />
              <Text
                style={[
                  styles.paymentMethodName,
                  {color: colors.text.primary},
                ]}>
                {option.name}
              </Text>
              {selectedPayment === option.id && (
                <Icon name="check-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <View style={styles.bottomContainer}>
          <Text style={[styles.totalPrice, {color: colors.text.primary}]}>
            ₹{totalPrice?.toFixed(2)}
          </Text>
          <TouchableOpacity
            style={[styles.continueButton, {backgroundColor: colors.primary}]}
            onPress={handleCheckout}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={[styles.continueButtonText, {color: colors.white}]}>
                Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  offerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  offerText: {
    fontSize: 14,
  },
  offerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  paymentOptionDetails: {
    marginLeft: 12,
  },
  paymentOptionName: {
    fontSize: 14,
  },
  paymentOptionDescription: {
    fontSize: 12,
  },
});

export default CheckoutScreen;