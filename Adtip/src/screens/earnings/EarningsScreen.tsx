import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { IndianRupee, TrendingUp, Calendar, Target, Gift } from 'lucide-react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import Header from '../../components/common/Header';
import {useNavigation} from '@react-navigation/native';
import ApiService from '../../services/ApiService';
import WalletService from '../../services/WalletService';

interface EarningsData {
  totalEarned: number;
  thisMonth: number;
  thisWeek: number;
  todayEarnings: number;
  withdrawalTotal: number;
  availableBalance: number;
  rewardHistory: any[];
  withdrawalHistory: any[];
  transactionHistory: any[];
}

const EarningsScreen: React.FC = () => {
  const {colors, isDarkMode} = useTheme();
  const {user} = useAuth();
  const navigation = useNavigation();

  // State management
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarned: 0,
    thisMonth: 0,
    thisWeek: 0,
    todayEarnings: 0,
    withdrawalTotal: 0,
    availableBalance: 0,
    rewardHistory: [],
    withdrawalHistory: [],
    transactionHistory: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch earnings data from APIs
  const fetchEarningsData = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Fetch data from multiple APIs in parallel
      const [
        walletBalance,
        transactionHistory,
        withdrawalHistory,
        rewardHistory
      ] = await Promise.allSettled([
        WalletService.getWalletBalance(user.id),
        WalletService.getTransactionHistory(user.id),
        ApiService.getWithdrawalHistory(Number(user.id)),
        ApiService.getRewardHistory(1, 50) // Get more records for calculations
      ]);

      // Process wallet balance
      const balance = walletBalance.status === 'fulfilled' ? parseFloat(walletBalance.value || '0') : 0;

      // Process transaction history
      const transactions = transactionHistory.status === 'fulfilled' ? transactionHistory.value : [];

      // Process withdrawal history
      const withdrawals = withdrawalHistory.status === 'fulfilled' ? withdrawalHistory.value?.data || [] : [];

      // Process reward history
      const rewards = rewardHistory.status === 'fulfilled' ? rewardHistory.value?.data || [] : [];

      // Calculate earnings metrics
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Calculate total earned from transactions (credit transactions)
      const creditTransactions = transactions.filter((t: any) =>
        t.transaction_type === 'credit' || t.transaction_type === 'Credit' || t.amount > 0
      );

      const totalEarned = creditTransactions.reduce((sum: number, t: any) =>
        sum + parseFloat(t.amount || 0), 0
      );

      // Calculate this month's earnings
      const thisMonthEarnings = creditTransactions
        .filter((t: any) => new Date(t.created_at) >= startOfMonth)
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

      // Calculate this week's earnings
      const thisWeekEarnings = creditTransactions
        .filter((t: any) => new Date(t.created_at) >= startOfWeek)
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

      // Calculate today's earnings
      const todayEarnings = creditTransactions
        .filter((t: any) => new Date(t.created_at) >= startOfDay)
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

      // Calculate total withdrawals
      const totalWithdrawals = withdrawals.reduce((sum: number, w: any) =>
        sum + parseFloat(w.amount || 0), 0
      );

      setEarningsData({
        totalEarned,
        thisMonth: thisMonthEarnings,
        thisWeek: thisWeekEarnings,
        todayEarnings,
        withdrawalTotal: totalWithdrawals,
        availableBalance: balance,
        rewardHistory: rewards,
        withdrawalHistory: withdrawals,
        transactionHistory: transactions
      });

    } catch (error) {
      console.error('Error fetching earnings data:', error);
      setError('Failed to load earnings data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Load data on component mount
  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEarningsData();
  }, [fetchEarningsData]);

  // Handle navigation to different sections
  const handleNavigation = useCallback((section: string) => {
    switch (section) {
      case 'transaction_history':
        // Show transaction history modal or navigate to dedicated screen
        Alert.alert(
          'Transaction History',
          `Total transactions: ${earningsData.transactionHistory.length}\nTotal earned: ₹${earningsData.totalEarned.toFixed(2)}`,
          [{ text: 'OK' }]
        );
        break;
      case 'withdrawal_history':
        // Show withdrawal history
        Alert.alert(
          'Withdrawal History',
          `Total withdrawals: ${earningsData.withdrawalHistory.length}\nTotal withdrawn: ₹${earningsData.withdrawalTotal.toFixed(2)}`,
          [{ text: 'OK' }]
        );
        break;
      case 'wallet':
        navigation.navigate('Wallet' as never);
        break;
      case 'install_to_earn':
        navigation.navigate('PlayToEarn' as never); // This now goes to InstallToEarnScreen
        break;
      default:
        console.log(`Navigate to ${section}`);
    }
  }, [navigation, earningsData]);

  // Menu items with real functionality
  const menuItems = [
    {
      id: 'transaction_history',
      icon: 'list',
      title: 'Transaction History',
      subtitle: `${earningsData.transactionHistory.length} transactions`,
      onPress: () => handleNavigation('transaction_history'),
      iconBgColor: '#FFFAEB',
      iconColor: '#F6A723',
    },
    {
      id: 'withdrawal_history',
      icon: 'download',
      title: 'Withdrawal History',
      subtitle: `₹${earningsData.withdrawalTotal.toFixed(2)} withdrawn`,
      onPress: () => handleNavigation('withdrawal_history'),
      iconBgColor: '#F0F9FF',
      iconColor: '#0091FF',
    },
    {
      id: 'wallet',
      icon: 'credit-card',
      title: 'My Wallet',
      subtitle: `₹${earningsData.availableBalance.toFixed(2)} available`,
      onPress: () => handleNavigation('wallet'),
      iconBgColor: '#F0FDF4',
      iconColor: '#10B981',
    },
    {
      id: 'install_to_earn',
      icon: 'smartphone',
      title: 'Install to Earn',
      subtitle: 'Earn more by installing apps',
      onPress: () => handleNavigation('install_to_earn'),
      iconBgColor: '#FFF5F5',
      iconColor: '#F87171',
      badge: 'New'
    },
  ];

  const renderMenuItem = (item: {
    id: string;
    icon: string;
    title: string;
    onPress: () => void;
    iconBgColor: string;
    iconColor: string;
    badge?: string;
  }) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.menuItem,
        {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'},
      ]}
      onPress={item.onPress}>
      <View style={[styles.menuItemIconContainer, {backgroundColor: item.iconBgColor}]}>
        <Icon name={item.icon} size={22} color={item.iconColor} />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={[styles.menuItemText, {color: colors.text.primary}]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={[styles.menuItemSubtitle, {color: colors.text.secondary}]}>
            {item.subtitle}
          </Text>
        )}
      </View>
      <View style={styles.menuItemRight}>
        {item.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <Header
          title="Earnings"
          showWallet={false}
          showSearch={false}
          showPremium={false}
          leftComponent={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.text.secondary}]}>
            Loading earnings data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <Header
          title="Earnings"
          showWallet={false}
          showSearch={false}
          showPremium={false}
          leftComponent={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={colors.error || '#F87171'} />
          <Text style={[styles.errorTitle, {color: colors.text.primary}]}>
            Unable to Load Data
          </Text>
          <Text style={[styles.errorMessage, {color: colors.text.secondary}]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: colors.primary}]}
            onPress={fetchEarningsData}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        title="Earnings"
        showWallet={false}
        showSearch={false}
        showPremium={false}
        leftComponent={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Earnings Card */}
        <View style={[styles.earningsCard, {backgroundColor: isDarkMode ? colors.card : '#FFFFFF'}]}>
          <View style={styles.earningsHeader}>
            <LinearGradient
              colors={['#FF6B00', '#FF8A00']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.earningsIcon}>
              <IndianRupee size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.earningsTitle, {color: colors.text.primary}]}>Earnings</Text>
          </View>

          <View style={styles.earningsStats}>
            <View style={styles.totalEarnings}>
              <Text style={[styles.totalAmount, {color: colors.text.primary}]}>
                ₹{earningsData.totalEarned.toFixed(2)}
              </Text>
              <Text style={[styles.totalLabel, {color: colors.text.tertiary}]}>
                Total Earned
              </Text>
            </View>

            <View style={styles.monthlyEarnings}>
              <Text style={[styles.monthlyAmount, {color: '#10B981'}]}>
                ₹{earningsData.thisMonth.toFixed(2)}
              </Text>
              <Text style={[styles.monthlyLabel, {color: colors.text.tertiary}]}>
                This Month
              </Text>
            </View>
          </View>

          {/* Additional Stats Row */}
          <View style={styles.additionalStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: colors.text.primary}]}>
                ₹{earningsData.thisWeek.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, {color: colors.text.tertiary}]}>
                This Week
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: colors.text.primary}]}>
                ₹{earningsData.todayEarnings.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, {color: colors.text.tertiary}]}>
                Today
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: '#10B981'}]}>
                ₹{earningsData.availableBalance.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, {color: colors.text.tertiary}]}>
                Available
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        {menuItems.map(renderMenuItem)}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  earningsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  earningsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  totalEarnings: {
    flex: 1,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
  },
  totalLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  monthlyEarnings: {
    alignItems: 'flex-end',
  },
  monthlyAmount: {
    fontSize: 22,
    fontWeight: '600',
  },
  monthlyLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  progressSection: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressAmount: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'right',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
});

export default EarningsScreen;
