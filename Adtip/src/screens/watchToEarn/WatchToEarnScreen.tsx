import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/common/Header';
import { useTabNavigator } from '../../contexts/TabNavigatorContext';
import { AdCard } from '../../components/ads';
import { useAdList } from '../../hooks';
import { AdModelType } from '../../types/ads';
import type { MainNavigatorParamList } from '../../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<MainNavigatorParamList>;

const WatchToEarnScreen: React.FC = () => {
  const { colors } = useTheme();
  const { contentPaddingBottom } = useTabNavigator();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const userId = user?.id || 0;

  const {
    filteredAds,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    refetch,
    loadMore,
    adTypeFilter,
    setAdTypeFilter,
    totalAds,
  } = useAdList(userId, {
    pageSize: 20,
    autoFetch: true,
  });

  // Filter options
  const filterOptions = [
    { label: 'All Ads', value: null as AdModelType | null, icon: 'apps' },
    { label: 'Quick Skip', value: 'SKIP' as AdModelType, icon: 'skip-next' },
    { label: 'Full Watch', value: 'NON_SKIP' as AdModelType, icon: 'play-circle-filled' },
    { label: 'Brand Bonus', value: 'BRAND_AWARENESS' as AdModelType, icon: 'stars' },
  ];

  const handleAdPress = (adId: number) => {
    navigation.navigate('AdView', { userId, adId });
  };

  const handleHistoryPress = () => {
    navigation.navigate('AdHistory');
  };

  const renderFilterButton = ({ label, value, icon }: typeof filterOptions[0]) => {
    const isActive = adTypeFilter === value;
    return (
      <TouchableOpacity
        key={label}
        style={[
          styles.filterButton,
          { 
            backgroundColor: isActive ? colors.primary : colors.card,
            borderColor: isActive ? colors.primary : colors.border,
          }
        ]}
        onPress={() => setAdTypeFilter(value)}
        activeOpacity={0.7}
      >
        <Icon 
          name={icon} 
          size={16} 
          color={isActive ? '#FFFFFF' : colors.text.secondary} 
        />
        <Text style={[
          styles.filterButtonText,
          { color: isActive ? '#FFFFFF' : colors.text.primary }
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Stats Card */}
      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="video-library" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {totalAds}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Available Ads
            </Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <TouchableOpacity 
            style={styles.statItem}
            onPress={handleHistoryPress}
            activeOpacity={0.7}
          >
            <Icon name="history" size={24} color="#10B981" />
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              View
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filterOptions.map(renderFilterButton)}
      </View>

      {/* Section Title */}
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        {adTypeFilter ? filterOptions.find(f => f.value === adTypeFilter)?.label : 'All Ads'}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="video-library" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
        No Ads Available
      </Text>
      <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
        {adTypeFilter 
          ? 'No ads match your current filter. Try selecting a different filter.'
          : 'Check back later for new ads to watch and earn rewards!'
        }
      </Text>
      {adTypeFilter && (
        <TouchableOpacity
          style={[styles.clearFilterButton, { backgroundColor: colors.primary }]}
          onPress={() => setAdTypeFilter(null)}
          activeOpacity={0.8}
        >
          <Text style={styles.clearFilterButtonText}>Clear Filter</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Icon name="error-outline" size={64} color="#EF4444" />
      <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
        Failed to Load Ads
      </Text>
      <Text style={[styles.errorText, { color: colors.text.secondary }]}>
        {error || 'Something went wrong. Please try again.'}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={refetch}
        activeOpacity={0.8}
      >
        <Icon name="refresh" size={20} color="#FFFFFF" />
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerLoaderText, { color: colors.text.secondary }]}>
          Loading more ads...
        </Text>
      </View>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Watch to Earn" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading ads...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Watch to Earn" />
      
      {error && !isLoading ? (
        renderErrorState()
      ) : (
        <FlatList
          data={filteredAds}
          renderItem={({ item }) => (
            <AdCard
              ad={item}
              onPress={() => handleAdPress(item.AD_ID)}
            />
          )}
          keyExtractor={(item) => item.AD_ID.toString()}
          ListHeaderComponent={renderHeader()}
          ListEmptyComponent={!isLoading ? renderEmptyState() : null}
          ListFooterComponent={renderFooter()}
          onEndReached={hasMore ? loadMore : null}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: contentPaddingBottom + 16,
          }}
        />
      )}
    </SafeAreaView>
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
    fontSize: 14,
    fontWeight: '500',
  },
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearFilterButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  clearFilterButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default WatchToEarnScreen;
