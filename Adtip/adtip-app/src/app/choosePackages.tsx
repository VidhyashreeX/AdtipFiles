import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function ChoosePackagesScreen() {
  const router = useRouter();

  const handleBuyNow = (packageName: string, price: number) => {
    console.log(`Buy Now pressed for ${packageName}`);
    router.push({
      pathname: '/checkout',
      params: { price: price.toString() }, // Pass the price as a string
    });
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Packages</Text>
        </View>

        <View style={styles.packagesGrid}>
          {/* Monthly Pack */}
          <View style={styles.packageCard}>
            <Text style={styles.packageTitle}>MONTHLY PACK</Text>
            <Text style={styles.packageDescription}>After applying Referral Coupon</Text>
            <Text style={styles.packageDetails}>Yearly plan as per selected plan</Text>
            <Text style={styles.packagePrice}>₹2500</Text>
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => handleBuyNow('Monthly Pack', 2500)}
            >
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
          </View>

          {/* Half-Yearly Pack */}
          <View style={styles.packageCard}>
            <Text style={styles.packageTitle}>HALF-YEARLY PACK</Text>
            <Text style={styles.packageDescription}>After applying Referral Coupon</Text>
            <Text style={styles.packageDetails}>Yearly plan as per selected plan</Text>
            <Text style={styles.packagePrice}>₹12000</Text>
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => handleBuyNow('Half-Yearly Pack', 12000)}
            >
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
          </View>

          {/* Quarterly Pack */}
          <View style={styles.packageCard}>
            <Text style={styles.packageTitle}>QUARTERLY PACK</Text>
            <Text style={styles.packageDescription}>After applying Referral Coupon</Text>
            <Text style={styles.packageDetails}>Yearly plan as per selected plan</Text>
            <Text style={styles.packagePrice}>₹6000</Text>
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => handleBuyNow('Quarterly Pack', 6000)}
            >
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
          </View>

          {/* Yearly Pack */}
          <View style={styles.packageCard}>
            <Text style={styles.packageTitle}>YEARLY PACK</Text>
            <Text style={styles.packageDescription}>After applying Referral Coupon</Text>
            <Text style={styles.packageDetails}>Yearly plan as per selected plan</Text>
            <Text style={styles.packagePrice}>₹12000</Text>
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => handleBuyNow('Yearly Pack', 12000)}
            >
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  packageCard: {
    width: '48%', // Two cards per row with some spacing
    height: 240, // Fixed height to ensure uniform card size
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: 'space-between', // Distribute content to push button to bottom
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  packageDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  packageDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  buyButton: {
    backgroundColor: '#00CED1',
    padding: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});