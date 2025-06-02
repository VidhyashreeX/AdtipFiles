import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';

interface EarningItem {
  id: string;
  type: 'ad_view' | 'content_tip' | 'referral' | 'bonus';
  amount: number;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

interface EarningsStats {
  totalEarnings: number;
  thisMonth: number;
  thisWeek: number;
  today: number;
  pendingEarnings: number;
}

const EarningsScreen: React.FC = () => {
  const { colors } = useTheme();
  const [earnings, setEarnings] = useState<EarningItem[]>([]);
  const [stats, setStats] = useState<EarningsStats>({
    totalEarnings: 0,
    thisMonth: 0,
    thisWeek: 0,
    today: 0,
    pendingEarnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    // Simulate API call
    setTimeout(() => {
      const mockEarnings: EarningItem[] = [
        {
          id: '1',
          type: 'ad_view',
          amount: 0.50,
          description: 'Watched rewarded ad',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          status: 'completed',
        },
        {
          id: '2',
          type: 'content_tip',
          amount: 2.00,
          description: 'Tip received on video',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          status: 'completed',
        },
        {
          id: '3',
          type: 'referral',
          amount: 5.00,
          description: 'Referral bonus',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          status: 'pending',
        },
        {
          id: '4',
          type: 'ad_view',
          amount: 0.25,
          description: 'Offerwall completion',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          status: 'completed',
        },
        {
          id: '5',
          type: 'bonus',
          amount: 1.00,
          description: 'Daily login bonus',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          status: 'completed',
        },
      ];

      const mockStats: EarningsStats = {
        totalEarnings: 25.75,
        thisMonth: 8.75,
        thisWeek: 3.75,
        today: 0.50,
        pendingEarnings: 5.00,
      };

      setEarnings(mockEarnings);
      setStats(mockStats);
      setIsLoading(false);
      setIsRefreshing(false);
    }, 1000);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadEarnings();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ad_view':
        return 'eye';
      case 'content_tip':
        return 'heart';
      case 'referral':
        return 'users';
      case 'bonus':
        return 'gift';
      default:
        return 'dollar-sign';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ad_view':
        return '#4ECDC4';
      case 'content_tip':
        return '#FF6B6B';
      case 'referral':
        return '#45B7D1';
      case 'bonus':
        return '#96CEB4';
      default:
        return colors.primary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#96CEB4';
      case 'pending':
        return '#FFEAA7';
      case 'failed':
        return '#FF6B6B';
      default:
        return colors.text.secondary;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const renderStatCard = (title: string, amount: number, icon: string) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.statAmount, { color: colors.text.primary }]}>
        ${amount.toFixed(2)}
      </Text>
      <Text style={[styles.statTitle, { color: colors.text.secondary }]}>
        {title}
      </Text>
    </View>
  );

  const renderEarningItem = ({ item }: { item: EarningItem }) => (
    <View style={[styles.earningItem, { borderBottomColor: colors.border.light }]}>
      <View style={[styles.earningIconContainer, { backgroundColor: getTypeColor(item.type) + '20' }]}>
        <Icon 
          name={getTypeIcon(item.type)} 
          size={20} 
          color={getTypeColor(item.type)}
        />
      </View>
      
      <View style={styles.earningContent}>
        <Text style={[styles.earningDescription, { color: colors.text.primary }]}>
          {item.description}
        </Text>
        <View style={styles.earningMeta}>
          <Text style={[styles.earningTimestamp, { color: colors.text.tertiary }]}>
            {formatTimestamp(item.timestamp)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.earningAmount, { color: colors.primary }]}>
        +${item.amount.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Earnings" showBackButton />
      
      <FlatList
        data={earnings}
        renderItem={renderEarningItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                {renderStatCard('Total Earnings', stats.totalEarnings, 'dollar-sign')}
                {renderStatCard('This Month', stats.thisMonth, 'calendar')}
              </View>
              <View style={styles.statsRow}>
                {renderStatCard('This Week', stats.thisWeek, 'trending-up')}
                {renderStatCard('Today', stats.today, 'clock')}
              </View>
            </View>

            {/* Pending Earnings */}
            {stats.pendingEarnings > 0 && (
              <View style={[styles.pendingContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.pendingContent}>
                  <Icon name="clock" size={20} color="#FFEAA7" />
                  <Text style={[styles.pendingText, { color: colors.text.primary }]}>
                    ${stats.pendingEarnings.toFixed(2)} pending
                  </Text>
                </View>
                <Text style={[styles.pendingSubtext, { color: colors.text.secondary }]}>
                  Will be processed within 24-48 hours
                </Text>
              </View>
            )}

            {/* Earnings History Header */}
            <View style={styles.historyHeader}>
              <Text style={[styles.historyTitle, { color: colors.text.primary }]}>
                Recent Earnings
              </Text>
              <TouchableOpacity>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Icon name="dollar-sign" size={48} color={colors.text.tertiary} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                No earnings yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.text.tertiary }]}>
                Start watching ads and creating content to earn money
              </Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  pendingContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  pendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pendingText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pendingSubtext: {
    fontSize: 14,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  earningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  earningIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  earningContent: {
    flex: 1,
  },
  earningDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  earningMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningTimestamp: {
    fontSize: 12,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EarningsScreen;
