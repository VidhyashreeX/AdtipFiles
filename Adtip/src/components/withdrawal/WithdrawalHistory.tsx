import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import ApiService from '../../services/ApiService';

interface WithdrawalHistoryProps {
  userId: number;
  type?: 'all' | 'wallet' | 'referral' | 'channel';
}

interface WithdrawalItem {
  id: number;
  amount: number;
  type: string;
  method?: string;
  status: string;
  created_at: string;
  processed_at?: string;
}

const WithdrawalHistory: React.FC<WithdrawalHistoryProps> = ({
  userId,
  type = 'all',
}) => {
  const { colors } = useTheme();
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadWithdrawals();
  }, [userId, type]);

  const loadWithdrawals = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }

      const response = await ApiService.getWithdrawalHistory(userId, type, page, 10);
      
      if (response.status === 200) {
        const newWithdrawals = response.data || [];
        
        if (isRefresh || page === 1) {
          setWithdrawals(newWithdrawals);
        } else {
          setWithdrawals(prev => [...prev, ...newWithdrawals]);
        }
        
        setHasMore(newWithdrawals.length === 10);
      }
    } catch (error) {
      console.error('Error loading withdrawal history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadWithdrawals(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      loadWithdrawals();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return '#00C851';
      case 'pending':
        return '#FF8800';
      case 'rejected':
      case 'failed':
        return '#FF4444';
      default:
        return colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'check-circle';
      case 'pending':
        return 'clock';
      case 'rejected':
      case 'failed':
        return 'x-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const renderWithdrawalItem = ({ item }: { item: WithdrawalItem }) => (
    <View style={[styles.withdrawalItem, { backgroundColor: colors.surface }]}>
      <View style={styles.withdrawalHeader}>
        <View style={styles.withdrawalInfo}>
          <Text style={[styles.withdrawalType, { color: colors.text.primary }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Withdrawal
          </Text>
          <Text style={[styles.withdrawalDate, { color: colors.text.secondary }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        <View style={styles.withdrawalAmount}>
          <Text style={[styles.amountText, { color: colors.text.primary }]}>
            {formatAmount(item.amount)}
          </Text>
          <View style={[styles.statusContainer, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Icon name={getStatusIcon(item.status)} size={12} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      
      {item.method && (
        <View style={styles.methodContainer}>
          <Icon name="credit-card" size={14} color={colors.text.secondary} />
          <Text style={[styles.methodText, { color: colors.text.secondary }]}>
            {item.method}
          </Text>
        </View>
      )}
      
      {item.processed_at && (
        <View style={styles.processedContainer}>
          <Icon name="check" size={12} color={colors.success} />
          <Text style={[styles.processedText, { color: colors.text.tertiary }]}>
            Processed: {formatDate(item.processed_at)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="file-text" size={48} color={colors.text.secondary} />
      <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
        No Withdrawal History
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
        You haven&apos;t made any withdrawal requests yet.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.text.secondary }]}>
          Loading more...
        </Text>
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading withdrawal history...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={withdrawals}
      renderItem={renderWithdrawalItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.1}
      ListEmptyComponent={renderEmptyState}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  withdrawalItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  withdrawalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  withdrawalInfo: {
    flex: 1,
  },
  withdrawalType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  withdrawalDate: {
    fontSize: 12,
  },
  withdrawalAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  methodText: {
    fontSize: 12,
  },
  processedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  processedText: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
  },
});

export default WithdrawalHistory; 