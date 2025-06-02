// src/screens/wallet/WalletScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Components
import Header from '../../components/common/Header';

// Context and services
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/ApiService';
import RewardService from '../../services/RewardService';
import { ENDPOINTS } from '../../constants/api';

interface WalletBalance {
  coins: number;
  currency: string;
  lastUpdated: Date;
}

const WalletScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();

  // State
  const [balance, setBalance] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [offerwallLoading, setOfferwallLoading] = useState(false);

  // Fetch wallet data
  const fetchWalletData = async () => {
  try {
    setIsLoading(true);
    if (!user || !user.id) throw new Error('User not found');
    const response = await fetch(`/api/getfunds/${user.id}`);
    const data = await response.json();
    if (data && data.availableBalance) {
      setBalance(data.availableBalance);
    } else {
      setBalance('0.00');
    }
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    Alert.alert('Error', 'Failed to load wallet data. Please try again.');
    setBalance('0.00');
  } finally {
    setIsLoading(false);
    setIsRefreshing(false);
  }
};

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchWalletData();
  };
  // Show offerwall to earn coins
  const handleShowOfferwall = async () => {
    try {
      setOfferwallLoading(true);
      
      // Commented out PubScale integration - June 2, 2025
      // Show the PubScale offerwall
      await RewardService.showOfferwall();
      
      // Refresh wallet data after offerwall closes
      fetchWalletData();
    } catch (error) {
      console.error('Error showing offerwall:', error);
      Alert.alert('Error', 'Failed to open offerwall. Please try again later.');
    } finally {
      setOfferwallLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchWalletData();
  }, []);

  // Render loading state
  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Wallet" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />          <Text style={[styles.loadingText, { color: colors.text.primary }]}>
            Loading wallet data...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Wallet" showBackButton />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceValue}>
            ₹{balance}
          </Text>
        </View>

        {/* Earn More Coins Button */}
        <TouchableOpacity
          style={[styles.earnButton, { backgroundColor: colors.primary }]}
          onPress={handleShowOfferwall}
          disabled={offerwallLoading}
        >
          {offerwallLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="gift" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.earnButtonText}>Earn More Coins</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Transactions List */}
        <View style={styles.transactionsContainer}>          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Transaction History
          </Text>

          {transactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No transactions to display
            </Text>
          ) : (
            transactions.map((transaction, index) => (
              <View
                key={`transaction-${index}`}
                style={[styles.transactionItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.transactionDetails}>                  <Text style={[styles.transactionTitle, { color: colors.text.primary }]}>
                    {transaction.description || 'Transaction'}
                  </Text>
                  <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                    {new Date(transaction.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color:
                        transaction.type === 'credit' ? colors.success : colors.error,
                    },
                  ]}
                >
                  {transaction.type === 'credit' ? '+' : '-'}
                  {transaction.amount} Coins
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  contentContainer: {
    padding: 16,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  coinText: {
    fontSize: 20,
    fontWeight: 'normal',
  },
  balanceInfo: {
    fontSize: 14,
    color: '#666',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  earnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  earnButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsContainer: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    padding: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WalletScreen;
