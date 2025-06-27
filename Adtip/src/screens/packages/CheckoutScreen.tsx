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
  Image, // Import Image component
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import FeatherIcon from 'react-native-vector-icons/Feather'; 
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialIcons'; 
import {useTheme} from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string | number; // Allow icon to be a string (for vector icons) or number (for require())
  isAssetImage?: boolean; // Corrected: Flag to indicate if the icon is an asset image
  description?: string; // Add optional description property
}

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {colors, isDarkMode} = useTheme(); // Get isDarkMode for proper theme handling
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('upi'); // Default to first option

  const routeParams = route.params as any;
  const packageData = routeParams?.package;
  const billingData = routeParams?.billing;
  const totalPrice = routeParams?.totalPrice || packageData?.price || 0; // Use package price as fallback

  const offers = [
    {id: 'offer1', description: 'Upto ₹200 cashback via CRED'},
  ];

  const allPaymentOptions: PaymentMethod[] = [
    {
      id: 'upi',
      name: 'UPI',
      description: 'Upto ₹200 cashback',
      icon: require('../../assets/upi_icon/upi.png'),
      isAssetImage: true,
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      icon: require('../../assets/phonepeicon/icons8-phone-pe-48.png'),
      isAssetImage: true,
    },
    {
      id: 'google',
      name: 'Google Pay',
      icon: require('../../assets/gpayicon/icons8-google-pay-48.png'),
      isAssetImage: true,
    },
    {id: 'apps', name: 'Apps & UPI ID', icon: 'grid'},
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
            onPress: () => navigation.navigate('TabHome' as never),
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

  // Proper border color handling for dark mode
  const borderColor = isDarkMode ? colors.border || '#444' : colors.border || '#E0E0E0';
  const surfaceColor = colors.surface || (isDarkMode ? '#1E1E1E' : '#FFFFFF');

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Payment Options"/>

      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Package Details Section */}
        {packageData && (
          <View style={[styles.section, {backgroundColor: surfaceColor, borderColor: borderColor}]}>
            <Text style={[styles.sectionTitle, {color: colors.text?.primary || colors.text}]}>
              Order Summary
            </Text>
            <View style={styles.orderItem}>
              <Text style={[styles.orderItemName, {color: colors.text?.primary || colors.text}]}>
                {packageData.name}
              </Text>
              <Text style={[styles.orderItemPrice, {color: colors.text?.primary || colors.text}]}>
                ₹{packageData.price}
              </Text>
            </View>
            {billingData && (
              <View style={styles.orderItem}>
                <Text style={[styles.orderItemName, {color: colors.text?.secondary || colors.text}]}>
                  Billing: {billingData.period}
                </Text>
              </View>
            )}
            <View style={[styles.totalRow, {borderTopColor: borderColor}]}>
              <Text style={[styles.totalLabel, {color: colors.text?.primary || colors.text}]}>
                Total Amount
              </Text>
              <Text style={[styles.totalPrice, {color: colors.primary}]}>
                ₹{totalPrice}
              </Text>
            </View>
          </View>
        )}

        {/* Available Offers Section */}
        <View style={[styles.section, {backgroundColor: surfaceColor, borderColor: borderColor}]}>
          <Text style={[styles.sectionTitle, {color: colors.text?.primary || colors.text}]}>
            Available Offers
          </Text>
          <View style={styles.offerRow}>
            <Text style={[styles.offerText, {color: colors.text?.primary || colors.text}]}>
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
        <View style={[styles.section, {backgroundColor: surfaceColor, borderColor: borderColor}]}>
          <Text style={[styles.sectionTitle, {color: colors.text?.primary || colors.text}]}>
            Recommended
          </Text>
          {allPaymentOptions.slice(0, 2).map(method => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod, 
                {
                  backgroundColor: surfaceColor,
                  borderColor: selectedPayment === method.id ? colors.primary : borderColor,
                  borderWidth: selectedPayment === method.id ? 2 : 1,
                }
              ]}
              onPress={() => setSelectedPayment(method.id)}
            >
              {method.isAssetImage ? (
                <Image source={method.icon as number} style={styles.paymentIconImage} />
              ) : (
                <FeatherIcon
                  name={method.icon as string}
                  size={20}
                  color={colors.text?.secondary || colors.text}
                />
              )}
              <View style={styles.paymentMethodDetails}>
                <Text style={[styles.paymentMethodName, {color: colors.text?.primary || colors.text}]}>
                  {method.name}
                </Text>
                {method.description && (
                  <Text style={[styles.paymentMethodDescription, {color: colors.text?.secondary || colors.text}]}>
                    {method.description}
                  </Text>
                )}
              </View>
              {selectedPayment === method.id && (
                <FeatherIcon name="check-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* All Payment Options */}
        <View style={[styles.section, {backgroundColor: surfaceColor, borderColor: borderColor}]}>
          <Text style={[styles.sectionTitle, {color: colors.text?.primary || colors.text}]}>
            All Payment Options
          </Text>
          {allPaymentOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.paymentMethod, 
                {
                  backgroundColor: surfaceColor,
                  borderColor: selectedPayment === option.id ? colors.primary : borderColor,
                  borderWidth: selectedPayment === option.id ? 2 : 1, 
                }
              ]}
              onPress={() => setSelectedPayment(option.id)}
            >
              {option.isAssetImage ? (
                <Image source={option.icon as number} style={styles.paymentIconImage} />
              ) : (
                <FeatherIcon
                  name={option.icon as string}
                  size={20}
                  color={colors.text?.secondary || colors.text}
                />
              )}
              <View style={styles.paymentMethodDetails}>
                <Text style={[styles.paymentMethodName, {color: colors.text?.primary || colors.text}]}>
                  {option.name}
                </Text>
                {option.description && (
                  <Text style={[styles.paymentMethodDescription, {color: colors.text?.secondary || colors.text}]}>
                    {option.description}
                  </Text>
                )}
              </View>
              {selectedPayment === option.id && (
                <FeatherIcon name="check-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Continue Button at Bottom */}
      <View style={[styles.bottomContainer, {backgroundColor: surfaceColor, borderTopColor: borderColor}]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.bottomTotalLabel, {color: colors.text?.secondary || colors.text}]}>
            Total Amount
          </Text>
          <Text style={[styles.bottomTotalPrice, {color: colors.text?.primary || colors.text}]}>
            ₹{totalPrice}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.continueButton, 
            {
              backgroundColor: colors.primary,
              opacity: loading ? 0.7 : 1
            }
          ]}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.continueButtonText}>
              Continue
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
  contentContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100, // Add space for fixed bottom button
  },
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 14,
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  paymentIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  paymentMethodDetails: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  paymentMethodDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerText: {
    fontSize: 14,
    flex: 1,
  },
  offerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceContainer: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  bottomTotalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen;