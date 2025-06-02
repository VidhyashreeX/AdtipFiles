import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { router, useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function CheckoutScreen() {
  const router = useRouter();
  const { price } = useLocalSearchParams(); // Retrieve the price from navigation params
  const orderValue = price ? parseInt(price as string) : 2500; // Default to 2500 if price is not provided

  const handlePayNow = () => {
    console.log('Pay Now pressed');
    // Add payment processing logic here (e.g., navigate to a payment gateway)
    router.push('/payment-success'); // Example route, adjust as needed
  };

  const handleViewCoupons = () => {
    console.log('View all coupons pressed');
    // Add logic to show available coupons (e.g., navigate to a coupons screen)
    router.push('/coupons'); // Example route, adjust as needed
  };

  const handleApplyCoupon = () => {
    console.log('Apply coupon pressed');
    // Add logic to apply the coupon (e.g., update the total value)
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>

        {/* Coupon Section */}
        <View style={styles.couponContainer}>
          <TextInput
            style={styles.couponInput}
            placeholder="Apply Coupon"
            placeholderTextColor="#6b7280"
          />
          <TouchableOpacity style={styles.applyButton} onPress={handleApplyCoupon}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleViewCoupons}>
          <Text style={styles.viewCouponsText}>VIEW ALL COUPON</Text>
        </TouchableOpacity>

        {/* Payment Details */}
        <View style={styles.paymentDetailsContainer}>
          <Text style={styles.paymentDetailsTitle}>Payment Details</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Order Value</Text>
            <Text style={styles.paymentValue}>₹{orderValue}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Total Value</Text>
            <Text style={styles.paymentValue}>₹{orderValue}</Text>
          </View>
        </View>

        {/* Pay Now Button */}
        <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 16,
    paddingTop: 48, // Move content down by 1 inch (96 pixels)
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6b48ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 16,
  },
  couponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    marginRight: 8,
  },
  applyButton: {
    backgroundColor: '#00CED1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  viewCouponsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00CED1',
    textAlign: 'right',
    marginBottom: 24,
  },
  paymentDetailsContainer: {
    marginBottom: 24,
  },
  paymentDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  payButton: {
    backgroundColor: '#00CED1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});