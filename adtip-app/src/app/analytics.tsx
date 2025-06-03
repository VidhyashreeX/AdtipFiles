import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, ChartBar as BarChart2} from 'lucide-react-native';
import {useRouter} from 'expo-router';
import {useUserStore} from '@/store/userStore';
import React, {useState, useEffect} from 'react';

export default function AnalyticsScreen() {
  const router = useRouter();
  const {channel} = useUserStore();
  // For non-premium users, analytics is off by default; for premium users, it's always on
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState<boolean>(
    channel?.isPremium ?? false,
  );

  // Update the toggle state based on premium status when the channel changes
  useEffect(() => {
    if (channel) {
      setIsAnalyticsEnabled(channel.isPremium); // Premium users always have analytics enabled
    }
  }, [channel]);

  const goBack = () => {
    router.back();
  };

  // Handle toggle button press
  const handleToggleAnalytics = () => {
    // Safety check for channel
    if (!channel) {
      router.push('/channel/create');
      return;
    }

    // Premium users cannot toggle analytics off (it's always on)
    if (channel.isPremium) {
      return; // Do nothing since the toggle is disabled for premium users
    }

    // For non-premium users: if they try to enable analytics, redirect to packages
    if (!channel.isPremium && !isAnalyticsEnabled) {
      router.push('/packages'); // Redirect to upgrade to premium
    }
  };

  if (!channel) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Text>You need to create a channel first</Text>
        <TouchableOpacity
          onPress={() => router.push('/channel/create')}
          style={styles.createButton}>
          <Text style={styles.createButtonText}>Create Channel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView>
        <View style={styles.channelSection}>
          <Text style={styles.channelName}>
            {channel.name} {/* Display the actual channel name */}
          </Text>
          <Text style={styles.channelHandle}>
            @ {channel.followers} followers
          </Text>
        </View>

        <View style={styles.toggleSection}>
          <Text style={styles.toggleLabel}>Channel Analytics</Text>
          <TouchableOpacity
            onPress={handleToggleAnalytics}
            disabled={channel.isPremium} // Disable toggle for premium users
            style={
              channel.isPremium
                ? styles.toggleSwitchDisabled
                : styles.toggleSwitch
            }>
            <View style={styles.toggleSwitch}>
              <View
                style={[
                  styles.toggleActive,
                  isAnalyticsEnabled
                    ? styles.toggleActiveOn
                    : styles.toggleActiveOff,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.statTitle}>
            Total Channel Views - {channel.totalViews}
          </Text>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.primaryCard]}>
              <Text style={styles.statCardTitle}>Total Earned</Text>
              <Text style={styles.statSubtitle}>Lifetime</Text>
              <Text style={styles.statAmount}>₹ 0.0</Text>
            </View>

            <View style={[styles.statCard, styles.secondaryCard]}>
              <Text style={styles.statCardTitle}>Total Withdrawn</Text>
              <Text style={styles.statSubtitle}>Till now</Text>
              <Text style={styles.statAmount}>₹ 0.0</Text>
            </View>
          </View>

          <View style={styles.statBlock}>
            <Text style={styles.statBlockTitle}>Total Views Earned</Text>
            <Text style={styles.statBlockAmount}>₹ 0.0</Text>
          </View>

          <View style={styles.statBlock}>
            <Text style={styles.statBlockTitle}>Paid Video Earned</Text>
            <Text style={styles.statBlockAmount}>₹ 0.0</Text>
          </View>

          <View style={styles.statBlock}>
            <Text style={styles.statBlockTitle}>Available Balance</Text>
            <Text style={styles.statBlockAmount}>₹ 0.0</Text>
          </View>

          <TouchableOpacity style={styles.withdrawButton}>
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>

          <Text style={styles.withdrawalNote}>
            Minimum withdrawal ₹1000 for premium. Non premium user minimum
            withdrawal ₹5000
          </Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <BarChart2 size={24} color="#333" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>
                How to Earn as a Content Creator on AdTip?
              </Text>
              <View style={styles.infoList}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoCheckmark}>✓</Text>
                  <Text style={styles.infoText}>
                    Get ₹1000 for every 1 lakh (100,000) views on your videos.
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoCheckmark}>✓</Text>
                  <Text style={styles.infoText}>
                    Upload paid videos and start earning from day one.
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoCheckmark}>✓</Text>
                  <Text style={styles.infoText}>
                    Easily withdraw your earnings directly to your bank account.
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoCheckmark}>✓</Text>
                  <Text style={styles.infoText}>
                    Note: These earning features are only available for Premium
                    users.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  channelSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  channelName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  channelHandle: {
    fontSize: 14,
    color: '#666',
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 50,
    height: 24,
    backgroundColor: '#E0F2F1',
    borderRadius: 12,
    padding: 2,
  },
  toggleSwitchDisabled: {
    width: 50,
    height: 24,
    backgroundColor: '#E0F2F1',
    borderRadius: 12,
    padding: 2,
    opacity: 0.5, // Visually indicate that the toggle is disabled
  },
  toggleActive: {
    width: 20,
    height: 20,
    backgroundColor: '#FF0000',
    borderRadius: 10,
  },
  toggleActiveOn: {
    marginLeft: 24,
  },
  toggleActiveOff: {
    marginLeft: 0,
  },
  statsSection: {
    padding: 16,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  primaryCard: {
    backgroundColor: '#E0F7FA',
  },
  secondaryCard: {
    backgroundColor: '#F5F5F5',
  },
  statCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statBlock: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  statBlockTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  statBlockAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  withdrawButton: {
    backgroundColor: '#00C853',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  withdrawButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  withdrawalNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoSection: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#F8F0FF',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoCheckmark: {
    color: '#00C853',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
