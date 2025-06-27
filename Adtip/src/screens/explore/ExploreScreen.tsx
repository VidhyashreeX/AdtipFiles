import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/common/Header';
import { usePaginatedData } from '../../hooks/useDataLayer';
import PostItemSkeleton from '../../components/skeletons/PostItemSkeleton';

// Constants
const API_BASE_URL = 'https://api.adtip.in';

// Define navigation param list
type RootStackParamList = {
  VideoPreview: { postId: string };
  TipShorts: { shortId: string };
  Explore: undefined;
};

// Define navigation type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ExploreItem {
  id: string;
  type: 'post' | 'short';
  imageUrl: string;
  caption: string;
}

const ExploreScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const loggedInUserId = 56768; // Replace with actual user ID from auth context

  // Use the new data layer for better performance
  const {
    data: exploreItems,
    isLoading: loading,
    isLoadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    isOnline,
  } = usePaginatedData<ExploreItem>(
    '/api/explore',
    { loggined_user_id: loggedInUserId },
    { 
      enabled: true,
      staleTime: 10 * 60 * 1000, // 10 minutes cache
      cacheKey: 'explore-content'
    }
  );

  // Helper function for full image URLs
  const getFullImageUrl = useCallback((url?: string | null): string => {
    if (!url || url === 'null' || url === 'undefined') {
      return 'https://via.placeholder.com/150';
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }, []);

  // Memoized render item for better performance
  const renderItem = useCallback(({ item }: { item: ExploreItem }) => {
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          if (item.type === 'post') {
            navigation.navigate('VideoPreview', { postId: item.id });
          } else {
            navigation.navigate('TipShorts', { 
              shortId: item.id,
            });
          }
        }}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: getFullImageUrl(item.imageUrl) }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        {item.type === 'short' && (
          <View style={styles.shortIndicator}>
            <Icon name="play-circle" size={24} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [navigation, getFullImageUrl]);

  // Memoized item layout for better scrolling performance
  const getItemLayout = useCallback(
    (data: any, index: number) => {
      const itemSize = width / 3;
      return {
        length: itemSize,
        offset: itemSize * index,
        index,
      };
    },
    [width]
  );

  // Memoized key extractor
  const keyExtractor = useCallback((item: ExploreItem) => item.id, []);

  // Loading skeleton component
  const renderLoadingSkeleton = useMemo(() => (
    <FlatList
      data={Array(9).fill(null)}
      numColumns={3}
      keyExtractor={(_, index) => `skeleton-${index}`}
      renderItem={() => (
        <View style={[styles.itemContainer, { backgroundColor: colors.surface }]}>
          <PostItemSkeleton />
        </View>
      )}
      scrollEnabled={false}
    />
  ), [colors.surface]);

  // Empty state component
  const renderEmptyState = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Icon name="search" size={48} color={colors.text.secondary} />
      <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
        {error ? 'Failed to load content' : 'No content found'}
      </Text>
      {error && (
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={refresh}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [colors, error, refresh]);

  // Network status indicator
  const NetworkIndicator = useMemo(() => {
    if (!isOnline) {
      return (
        <View style={[styles.networkIndicator, { backgroundColor: colors.error }]}>
          <Icon name="wifi-off" size={16} color="#FFF" />
          <Text style={styles.networkText}>Offline Mode</Text>
        </View>
      );
    }
    return null;
  }, [isOnline, colors.error]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background}]}>
      <Header title="Explore" />
      {NetworkIndicator}
      
      {loading && exploreItems.length === 0 ? (
        renderLoadingSkeleton
      ) : (
        <FlatList
          data={exploreItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={3}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onRefresh={refresh}
          refreshing={loading && exploreItems.length > 0}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : null
          }
          ListEmptyComponent={renderEmptyState}
          getItemLayout={getItemLayout}
          removeClippedSubviews={true}
          maxToRenderPerBatch={9}
          windowSize={5}
          initialNumToRender={9}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 2,
  },
  itemContainer: {
    flex: 1/3,
    aspectRatio: 1,
    margin: 1,
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  shortIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  loader: {
    marginVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  networkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  networkText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default ExploreScreen;