import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {router, useRouter} from 'expo-router';
import {ArrowLeft} from 'lucide-react-native';

export default function PackagesScreen() {
  const router = useRouter();

  const handleBuyNow = () => {
    console.log('Buy Now button pressed');
    router.push('/choosePackages'); // Navigate to the new Choose Packages screen
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Our Packages</Text>
        </View>

        <View style={styles.packagesContainer}>
          {/* Free Plan */}
          <View style={[styles.packageCard, styles.freeCard]}>
            <View style={styles.planHeaderFree}>
              <Text style={styles.planTitle}>FREE</Text>
            </View>
            <View style={styles.featuresContainer}>
              <Text style={styles.featureText}>
                <Text style={styles.checkmarkFree}>✔ </Text>
                No earnings for uploads on TipTube & TipShort
              </Text>
              <Text style={styles.featureText}>
                <Text style={styles.checkmarkFree}>✔ </Text>
                Free Video upload only
              </Text>
              <Text style={styles.featureText}>
                <Text style={styles.checkmarkFree}>✔ </Text>
                Earn 0.06 paisa per ad view
              </Text>
              <Text style={styles.featureText}>
                <Text style={styles.checkmarkFree}>✔ </Text>
                Fan call to earn 0.60 paisa (coming soon)
              </Text>
              <Text style={styles.featureText}>
                <Text style={styles.checkmarkFree}>✔ </Text>
                Fan video to earn 1 rs/- (coming soon)
              </Text>
            </View>
          </View>

          {/* Premium Plan */}
          <View style={[styles.packageCard, styles.premiumCard]}>
            <View style={styles.planHeaderPremium}>
              <Text style={styles.planTitle}>PREMIUM</Text>
            </View>
            <View style={styles.featuresContainer}>
              <Text style={styles.featureText}>
                <Text style={styles.checkmarkPremium}>✔ </Text>
                Earnings for uploads on TipTube & TipShort
              </Text>
              <Text style={styles.featureText}>
                <Text style={styles.checkmarkPremium}>✔ </Text>
                Free & Paid video upload
              </Text>
              <Text style={styles.featureText}>
                <Text style={styles.checkmarkPremium}>✔ </Text>
                To earn upto 10000/- rs per ad view
              </Text>
              <Text style={styles.featureText}>
                <Text style={styles.checkmarkPremium}>✔ </Text>
                Fan call to earn 4 rs/- (coming soon)
              </Text>
              <Text style={styles.featureText}>
                <Text style={styles.checkmarkPremium}>✔ </Text>
                Fan video to earn 8 rs/- (coming soon)
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
          <Text style={styles.buyButtonText}>Buy Now</Text>
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
  packagesContainer: {
    flexDirection: 'column', // Stack boxes vertically
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16, // Space between Free and Premium boxes
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  freeCard: {
    borderColor: '#FF0000',
    borderWidth: 1,
  },
  premiumCard: {
    borderColor: '#008000',
    borderWidth: 1,
  },
  planHeaderFree: {
    backgroundColor: '#FF0000',
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  planHeaderPremium: {
    backgroundColor: '#008000',
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  featuresContainer: {
    padding: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 8,
  },
  checkmarkFree: {
    color: '#FF0000',
  },
  checkmarkPremium: {
    color: '#008000',
  },
  buyButton: {
    backgroundColor: '#00CED1',
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
