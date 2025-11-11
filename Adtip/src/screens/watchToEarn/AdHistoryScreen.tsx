/**
 * AdHistoryScreen Component
 * 
 * Displays user's ad viewing history with:
 * - Complete list of viewed ads
 * - Earnings breakdown (base + bonus)
 * - Status indicators (completed, skipped, timed out)
 * - Date/time stamps
 * - Filter by status
 * - Pull-to-refresh
 * - Pagination support
 * - Total earnings summary
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AdViewerService from '../../services/AdViewerService';
import { AdTypeBadge } from '../../components/ads';
import type { ViewingHistoryResponse } from '../../services/AdViewerService';
import type { MainNavigatorParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<MainNavigatorParamList>;

// ================================================================
// Types
// ================================================================

type HistoryItem = {
  session_id: string;
  ad_id: number;
  campaign_name: string;
  ad_model_type: string;
  watch_time: number;
  required_watch_time: number;
  total_payout: number;
  status: string;
  created_at: string;
  completed_at: string;
};

type FilterStatus = 'all' | 'completed' | 'skipped' | 'timeout';

// ================================================================
// Main Component
// ================================================================

export const AdHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { user } = useAuth();

  // State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 20;

  // ================================================================
  // Data Fetching
  // ================================================================

  const fetchHistory = useCallback(async (isRefresh: boolean = false) => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
        setOffset(0);
      } else if (offset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      const currentOffset = isRefresh ? 0 : offset;
      const response: ViewingHistoryResponse = await AdViewerService.getViewingHistory(
        user.id,
        LIMIT,
        currentOffset
      );

      if (response.status === 200 && response.data) {
        const newHistory = response.data;
        
        if (isRefresh) {
          setHistory(newHistory);
          setOffset(newHistory.length);
        } else {
          setHistory(prev => [...prev, ...newHistory]);
          setOffset(prev => prev + newHistory.length);
        }

        // Check if there are more items
        setHasMore(newHistory.length === LIMIT);

        // Calculate total earnings
        const total = (isRefresh ? newHistory : [...history, ...newHistory])
          .filter(item => item.status === 'completed')
          .reduce((sum, item) => sum + item.total_payout, 0);
        setTotalEarnings(total);
      }
    } catch (err: any) {
      console.error('[AdHistory] Fetch error:', err);
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user?.id, offset, history]);

  // Initial load
  useEffect(() => {
    fetchHistory();
  }, []);

  // Filter history whenever data or filter changes
  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredHistory(history);
    } else {
      setFilteredHistory(
        history.filter(item => item.status === selectedFilter)
      );
    }
  }, [history, selectedFilter]);

  // ================================================================
  // Handlers
  // ================================================================

  const handleRefresh = () => {
    fetchHistory(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && !loading && hasMore) {
      fetchHistory(false);
    }
  };

  const handleFilterChange = (filter: FilterStatus) => {
    setSelectedFilter(filter);
  };

  const handleRetry = () => {
    setOffset(0);
    setHasMore(true);
    fetchHistory(true);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatWatchTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // ================================================================
  // Render Components
  // ================================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
        Ad History
      </Text>
      <View style={[styles.earningsCard, { backgroundColor: colors.card }]}>
        <Icon name="account-balance-wallet" size={24} color={colors.primary} />
        <View style={styles.earningsContent}>
          <Text style={[styles.earningsLabel, { color: colors.textSecondary }]}>
            Total Earned
          </Text>
          <Text style={[styles.earningsAmount, { color: colors.primary }]}>
            ${totalEarnings.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {(['all', 'completed', 'skipped', 'timeout'] as FilterStatus[]).map(filter => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterButton,
            {
              backgroundColor:
                selectedFilter === filter ? colors.primary : colors.card,
            },
          ]}
          onPress={() => handleFilterChange(filter)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterText,
              {
                color:
                  selectedFilter === filter ? colors.background : colors.text.primary,
              },
            ]}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    const isCompleted = item.status === 'completed';
    const isSkipped = item.status === 'skipped';
    const isTimeout = item.status === 'timeout';

    const statusColor = isCompleted
      ? '#22c55e'
      : isSkipped
      ? '#f59e0b'
      : '#ef4444';

    const statusIcon = isCompleted
      ? 'check-circle'
      : isSkipped
      ? 'skip-next'
      : 'cancel';

    return (
      <View style={[styles.historyItem, { backgroundColor: colors.card }]}>
        {/* Header Row */}
        <View style={styles.itemHeader}>
          <View style={styles.itemHeaderLeft}>
            <AdTypeBadge adType={item.ad_model_type as any} size="small" />
            <Text
              style={[styles.campaignName, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {item.campaign_name}
            </Text>
          </View>
          <Icon name={statusIcon} size={20} color={statusColor} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="play-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {formatWatchTime(item.watch_time)} / {formatWatchTime(item.required_watch_time)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="access-time" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        </View>

        {/* Footer Row */}
        <View style={styles.itemFooter}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
          {isCompleted && (
            <Text style={[styles.payoutText, { color: colors.primary }]}>
              +${item.total_payout.toFixed(2)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    const message =
      selectedFilter === 'all'
        ? "You haven't watched any ads yet"
        : `No ${selectedFilter} ads found`;

    return (
      <View style={styles.emptyContainer}>
        <Icon name="history" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {message}
        </Text>
        {selectedFilter === 'all' && (
          <TouchableOpacity
            style={[styles.watchNowButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={[styles.watchNowText, { color: colors.background }]}>
              Watch Ads Now
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Icon name="error-outline" size={64} color="#ef4444" />
      <Text style={[styles.errorText, { color: colors.text.primary }]}>
        {error}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={handleRetry}
        activeOpacity={0.7}
      >
        <Icon name="refresh" size={20} color={colors.background} />
        <Text style={[styles.retryText, { color: colors.background }]}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Loading more...
        </Text>
      </View>
    );
  };

  // ================================================================
  // Main Render
  // ================================================================

  if (error && history.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {renderHeader()}
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={filteredHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.session_id}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderFilters()}
          </>
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {loading && history.length === 0 && (
        <View style={styles.initialLoader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading history...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

// ================================================================
// Styles
// ================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  earningsContent: {
    marginLeft: 12,
    flex: 1,
  },
  earningsLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyItem: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  payoutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  watchNowButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  watchNowText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
  },
  initialLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
});

export default AdHistoryScreen;
